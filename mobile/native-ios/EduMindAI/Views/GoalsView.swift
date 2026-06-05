import SwiftUI

struct GoalsView: View {
    @StateObject private var vm = GoalsViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button(vm.showForm ? "İptal" : "Yeni Hedef") { vm.showForm.toggle() }
                }

                if vm.showForm {
                    Section("Hedef Oluştur") {
                        Picker("Kapsam", selection: Binding(
                            get: { vm.scope },
                            set: { vm.scopeChanged($0) }
                        )) {
                            Text("Genel").tag("general")
                            Text("Ders").tag("subject")
                            Text("Konu").tag("topic")
                        }
                        .pickerStyle(.segmented)

                        Picker("Periyot", selection: $vm.type) {
                            ForEach(vm.allowedTypes, id: \.self) { type in
                                Text(GoalLabels.typeLabel(type)).tag(type)
                            }
                        }

                        if vm.scope != "general" {
                            Picker("Ders", selection: Binding(
                                get: { vm.subjectId ?? 0 },
                                set: { newValue in Task { await vm.subjectChanged(newValue == 0 ? nil : newValue) } }
                            )) {
                                Text("Seçin").tag(0)
                                ForEach(vm.subjects) { subject in
                                    Text(subject.name).tag(subject.id)
                                }
                            }
                        }

                        if vm.scope == "topic" {
                            Picker("Konu", selection: Binding(
                                get: { vm.topicId ?? 0 },
                                set: { vm.topicId = $0 == 0 ? nil : $0 }
                            )) {
                                Text("Seçin").tag(0)
                                ForEach(vm.topics) { topic in
                                    Text(topic.name).tag(topic.id)
                                }
                            }
                        }

                        TextField("Hedef süre (dk)", text: $vm.targetDuration)
                            .keyboardType(.numberPad)
                        DatePicker("Başlangıç", selection: $vm.startDate, displayedComponents: .date)
                        LabeledContent("Bitiş", value: DateFormatters.formatDate(DateFormatters.apiDate.string(from: vm.endDate)))
                        Button("Kaydet") { Task { await vm.createGoal() } }
                    }
                }

                Section("Hedefler") {
                    if vm.goals.isEmpty && !vm.isLoading {
                        Text("Henüz hedef yok.").foregroundStyle(.secondary)
                    }
                    ForEach(vm.goals) { goal in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(GoalLabels.scopeLabel(for: goal)).font(.headline)
                                Spacer()
                                Text(GoalLabels.scopeBadgeLabel(scope: goal.resolvedScope))
                                    .font(.caption2)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color(.tertiarySystemFill))
                                    .clipShape(Capsule())
                            }
                            Text("\(GoalLabels.typeLabel(goal.type)) · \(DateFormatters.formatDate(goal.startDate)) - \(DateFormatters.formatDate(goal.endDate))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            ProgressView(value: Double(goal.progressPercent ?? 0), total: 100)
                            HStack {
                                Text("\(goal.currentDuration ?? 0)/\(goal.targetDuration) dk")
                                Spacer()
                                Text(GoalLabels.statusLabel(goal.status))
                            }
                            .font(.caption)
                        }
                        .padding(.vertical, 4)
                    }
                }

                if let error = vm.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Hedefler")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}
