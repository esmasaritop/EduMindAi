import SwiftUI

struct SubjectsView: View {
    @StateObject private var vm = SubjectsViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section("Yeni Ders") {
                    HStack {
                        TextField("Ders adı", text: $vm.newSubjectName)
                        Button("Ekle") { Task { await vm.createSubject() } }
                    }
                }

                Section("Dersler") {
                    if vm.subjects.isEmpty && !vm.isLoading {
                        Text("Henüz ders yok.").foregroundStyle(.secondary)
                    }
                    ForEach(vm.subjects) { subject in
                        DisclosureGroup(
                            isExpanded: Binding(
                                get: { vm.expandedSubjectIds.contains(subject.id) },
                                set: { _ in Task { await vm.toggleSubject(subject.id) } }
                            )
                        ) {
                            topicsSection(subject)
                        } label: {
                            HStack {
                                Text(subject.name).font(.headline)
                                Spacer()
                                Button(role: .destructive) {
                                    Task { await vm.deleteSubject(subject) }
                                } label: {
                                    Image(systemName: "trash")
                                }
                                .buttonStyle(.borderless)
                            }
                        }
                    }
                }

                if let error = vm.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Derslerim")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }

    @ViewBuilder
    private func topicsSection(_ subject: StudySubject) -> some View {
        let topics = vm.topicsBySubject[subject.id] ?? []
        HStack {
            TextField("Konu adı", text: Binding(
                get: { vm.newTopicNames[subject.id] ?? "" },
                set: { vm.newTopicNames[subject.id] = $0 }
            ))
            Button("Konu Ekle") { Task { await vm.createTopic(subjectId: subject.id) } }
                .font(.caption)
        }

        ForEach(topics) { topic in
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(topic.name)
                    Spacer()
                    Text("\(topic.studyTimeMinutes ?? 0) dk")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Toggle("Soru Takibi", isOn: Binding(
                    get: { topic.trackQuestions ?? false },
                    set: { _ in Task { await vm.toggleTrackQuestions(topic) } }
                ))
                HStack {
                    if vm.timerTopicId == topic.id {
                        Text(formatSeconds(vm.timerSeconds)).monospacedDigit()
                        if vm.isTimerRunning {
                            Button("Durdur & Kaydet") {
                                Task { await vm.stopTimerAndSave(topic: topic, subjectId: subject.id) }
                            }
                        }
                        Button("Reset") { vm.resetTimer() }
                    } else {
                        Button("Başlat") { vm.startTimer(for: topic) }
                    }
                    Button("Süre Ekle") {
                        Task { await vm.addManualTime(topic: topic, hours: 0, minutes: 30) }
                    }
                    Button(role: .destructive) {
                        Task { await vm.deleteTopic(topic) }
                    } label: {
                        Image(systemName: "trash")
                    }
                }
                .font(.caption)
            }
            .padding(.vertical, 4)
        }
    }

    private func formatSeconds(_ seconds: Int) -> String {
        String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
}
