import Foundation
import Combine

@MainActor
final class QuestionsViewModel: ObservableObject {
    struct EditableStat: Identifiable {
        let id: Int
        let topicName: String
        let subjectName: String
        var totalQuestions: String
        var correct: String
        var wrong: String
        var empty: String
        var isDirty = false
        var isSaved = false
    }

    @Published var stats: [EditableStat] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let envelope = try await network.request(Endpoint.questions(), as: CollectionEnvelope<QuestionStat>.self)
            stats = envelope.data.map { stat in
                EditableStat(
                    id: stat.topicId ?? stat.id,
                    topicName: stat.topic?.name ?? "Konu",
                    subjectName: stat.topic?.subject?.name ?? "Ders",
                    totalQuestions: String(stat.totalQuestions),
                    correct: String(stat.correct),
                    wrong: String(stat.wrong),
                    empty: String(stat.empty)
                )
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func save(_ stat: EditableStat) async {
        guard let total = Int(stat.totalQuestions),
              let correct = Int(stat.correct),
              let wrong = Int(stat.wrong),
              let empty = Int(stat.empty) else {
            errorMessage = "Tüm alanlar sayı olmalı."
            return
        }
        do {
            let payload = QuestionStatFormPayload(
                totalQuestions: total,
                correct: correct,
                wrong: wrong,
                empty: empty
            )
            _ = try await network.request(try Endpoint.upsertQuestionStat(topicId: stat.id, payload: payload), as: DataEnvelope<QuestionStat>.self)
            if let index = stats.firstIndex(where: { $0.id == stat.id }) {
                stats[index].isDirty = false
                stats[index].isSaved = true
            }
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func markDirty(id: Int) {
        guard let index = stats.firstIndex(where: { $0.id == id }) else { return }
        stats[index].isDirty = true
        stats[index].isSaved = false
    }

    func updateStat(id: Int, field: WritableKeyPath<EditableStat, String>, value: String) {
        guard let index = stats.firstIndex(where: { $0.id == id }) else { return }
        stats[index][keyPath: field] = value
        stats[index].isDirty = true
        stats[index].isSaved = false
    }
}
