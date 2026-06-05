import SwiftUI

struct StudySessionsView: View {
    @StateObject private var vm = StudySessionsViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button(vm.showForm ? "İptal" : "Yeni Seans") {
                        vm.showForm.toggle()
                    }
                }

                if vm.showForm {
                    Section("Seans Formu") {
                        Picker("Ders", selection: Binding(
                            get: { vm.subjectId ?? 0 },
                            set: { newValue in Task { await vm.subjectChanged(newValue == 0 ? nil : newValue) } }
                        )) {
                            Text("Seçin").tag(0)
                            ForEach(vm.subjects) { subject in
                                Text(subject.name).tag(subject.id)
                            }
                        }
                        Picker("Konu", selection: Binding(
                            get: { vm.topicId ?? 0 },
                            set: { vm.topicId = $0 == 0 ? nil : $0 }
                        )) {
                            Text("Opsiyonel").tag(0)
                            ForEach(vm.topics) { topic in
                                Text(topic.name).tag(topic.id)
                            }
                        }
                        TextField("Süre (dk)", text: $vm.duration)
                            .keyboardType(.numberPad)
                        Picker("Tür", selection: $vm.sessionType) {
                            Text("Manuel").tag("manual")
                            Text("Zamanlayıcı").tag("timer")
                        }
                        TextField("Notlar", text: $vm.notes)
                        Button("Kaydet") { Task { await vm.createSession() } }
                    }
                }

                Section("Seanslar") {
                    if vm.sessions.isEmpty && !vm.isLoading {
                        Text("Seans bulunamadı.").foregroundStyle(.secondary)
                    }
                    ForEach(vm.sessions) { session in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(session.subject?.name ?? "Ders").font(.headline)
                            Text("Konu: \(vm.topicName(from: session.notes))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(session.duration) dk · \(session.sessionType ?? "manual")")
                                .font(.caption)
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await vm.deleteSession(session) }
                            } label: {
                                Label("Sil", systemImage: "trash")
                            }
                        }
                    }
                }

                if let error = vm.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Çalışma Seansları")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}
