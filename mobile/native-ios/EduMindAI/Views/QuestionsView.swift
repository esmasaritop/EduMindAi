import SwiftUI

struct QuestionsView: View {
    @StateObject private var vm = QuestionsViewModel()

    var body: some View {
        NavigationStack {
            List {
                if vm.stats.isEmpty && !vm.isLoading {
                    Section {
                        Text("Takipteki konu yok. Derslerim'den bir konu için Soru Takibi'ni açın.")
                            .foregroundStyle(.secondary)
                    }
                }

                ForEach($vm.stats) { $stat in
                    Section("\(stat.subjectName) · \(stat.topicName)") {
                        TextField("Toplam", text: $stat.totalQuestions)
                            .keyboardType(.numberPad)
                            .onChange(of: stat.totalQuestions) { vm.markDirty(id: stat.id) }
                        TextField("Doğru", text: $stat.correct)
                            .keyboardType(.numberPad)
                            .onChange(of: stat.correct) { vm.markDirty(id: stat.id) }
                        TextField("Yanlış", text: $stat.wrong)
                            .keyboardType(.numberPad)
                            .onChange(of: stat.wrong) { vm.markDirty(id: stat.id) }
                        TextField("Boş", text: $stat.empty)
                            .keyboardType(.numberPad)
                            .onChange(of: stat.empty) { vm.markDirty(id: stat.id) }
                        Button(stat.isSaved ? "Kaydedildi" : "Kaydet") {
                            Task { await vm.save(stat) }
                        }
                        .disabled(!stat.isDirty && !stat.isSaved)
                    }
                }

                if let error = vm.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Sorularım")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}
