import SwiftUI

struct SubjectsView: View {
    @StateObject private var vm = SubjectsViewModel()
    @State private var editingSubject: StudySubject?
    @State private var editingTopic: Topic?
    @State private var editName = ""

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
                                Button {
                                    editingSubject = subject
                                    editName = subject.name
                                } label: {
                                    Image(systemName: "pencil")
                                }
                                .buttonStyle(.borderless)
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
            .alert("Dersi Düzenle", isPresented: Binding(
                get: { editingSubject != nil },
                set: { if !$0 { editingSubject = nil } }
            )) {
                TextField("Ders adı", text: $editName)
                Button("Kaydet") {
                    if let subject = editingSubject {
                        Task { await vm.updateSubject(subject, name: editName) }
                    }
                    editingSubject = nil
                }
                Button("İptal", role: .cancel) { editingSubject = nil }
            }
            .alert("Konuyu Düzenle", isPresented: Binding(
                get: { editingTopic != nil },
                set: { if !$0 { editingTopic = nil } }
            )) {
                TextField("Konu adı", text: $editName)
                Button("Kaydet") {
                    if let topic = editingTopic {
                        Task { await vm.updateTopicName(topic, name: editName) }
                    }
                    editingTopic = nil
                }
                Button("İptal", role: .cancel) { editingTopic = nil }
            }
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
                    Button {
                        editingTopic = topic
                        editName = topic.name
                    } label: {
                        Label("Düzenle", systemImage: "pencil")
                    }
                    Spacer()
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
}
