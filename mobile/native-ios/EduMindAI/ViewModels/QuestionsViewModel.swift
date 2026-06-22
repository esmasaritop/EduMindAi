import Foundation
import Combine

@MainActor
final class QuestionsViewModel: ObservableObject {
    enum InputMode: String, CaseIterable, Identifiable {
        case add
        case edit

        var id: String { rawValue }

        var label: String {
            switch self {
            case .add: return "Soru Ekle"
            case .edit: return "Düzenle"
            }
        }

        var icon: String {
            switch self {
            case .add: return "plus.circle"
            case .edit: return "square.and.pencil"
            }
        }
    }

    struct EditableStat: Identifiable {
        let id: Int
        let topicName: String
        let subjectName: String
        var savedTotal: Int
        var savedCorrect: Int
        var savedWrong: Int
        var savedEmpty: Int
        var editTotal: String
        var editCorrect: String
        var editWrong: String
        var editEmpty: String
        var addTotal: String = "0"
        var addCorrect: String = "0"
        var addWrong: String = "0"
        var addEmpty: String = "0"
        var mode: InputMode = .add
        var isSaving = false
        var savedFeedback = false

        var answered: Int { savedCorrect + savedWrong + savedEmpty }
        var isNew: Bool { answered == 0 && savedTotal == 0 }

        var correctPercent: Int {
            guard answered > 0 else { return 0 }
            return Int((Double(savedCorrect) / Double(answered) * 100).rounded())
        }

        var wrongPercent: Int {
            guard answered > 0 else { return 0 }
            return Int((Double(savedWrong) / Double(answered) * 100).rounded())
        }

        var emptyPercent: Int {
            guard answered > 0 else { return 0 }
            return Int((Double(savedEmpty) / Double(answered) * 100).rounded())
        }

        var canSubmitAdd: Bool {
            [addTotal, addCorrect, addWrong, addEmpty]
                .compactMap(Int.init)
                .contains(where: { $0 > 0 })
        }

        mutating func syncFromSaved() {
            editTotal = String(savedTotal)
            editCorrect = String(savedCorrect)
            editWrong = String(savedWrong)
            editEmpty = String(savedEmpty)
        }

        mutating func applySaved(total: Int, correct: Int, wrong: Int, empty: Int) {
            savedTotal = total
            savedCorrect = correct
            savedWrong = wrong
            savedEmpty = empty
            syncFromSaved()
            addTotal = "0"
            addCorrect = "0"
            addWrong = "0"
            addEmpty = "0"
        }
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
                    savedTotal: stat.totalQuestions,
                    savedCorrect: stat.correct,
                    savedWrong: stat.wrong,
                    savedEmpty: stat.empty,
                    editTotal: String(stat.totalQuestions),
                    editCorrect: String(stat.correct),
                    editWrong: String(stat.wrong),
                    editEmpty: String(stat.empty)
                )
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func saveEdit(_ stat: EditableStat) async {
        guard let index = stats.firstIndex(where: { $0.id == stat.id }) else { return }
        guard let payload = parsePayload(
            total: stats[index].editTotal,
            correct: stats[index].editCorrect,
            wrong: stats[index].editWrong,
            empty: stats[index].editEmpty
        ) else {
            errorMessage = "Tüm alanlar geçerli sayı olmalı."
            return
        }

        stats[index].isSaving = true
        stats[index].savedFeedback = false
        errorMessage = nil
        defer { stats[index].isSaving = false }

        do {
            let envelope = try await network.request(
                try Endpoint.upsertQuestionStat(topicId: stat.id, payload: payload),
                as: DataEnvelope<QuestionStat>.self
            )
            stats[index].applySaved(
                total: envelope.data.totalQuestions,
                correct: envelope.data.correct,
                wrong: envelope.data.wrong,
                empty: envelope.data.empty
            )
            stats[index].savedFeedback = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func saveAdd(_ stat: EditableStat) async {
        guard let index = stats.firstIndex(where: { $0.id == stat.id }) else { return }
        guard stats[index].canSubmitAdd else { return }

        stats[index].isSaving = true
        stats[index].savedFeedback = false
        errorMessage = nil
        defer { stats[index].isSaving = false }

        do {
            let payload = QuestionStatFormPayload(
                totalQuestions: Int(stats[index].addTotal) ?? 0,
                correct: Int(stats[index].addCorrect) ?? 0,
                wrong: Int(stats[index].addWrong) ?? 0,
                empty: Int(stats[index].addEmpty) ?? 0
            )
            let envelope = try await network.request(
                try Endpoint.addQuestionStat(topicId: stat.id, payload: payload),
                as: DataEnvelope<QuestionStat>.self
            )
            stats[index].applySaved(
                total: envelope.data.totalQuestions,
                correct: envelope.data.correct,
                wrong: envelope.data.wrong,
                empty: envelope.data.empty
            )
            stats[index].savedFeedback = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func setMode(id: Int, mode: InputMode) {
        guard let index = stats.firstIndex(where: { $0.id == id }) else { return }
        stats[index].mode = mode
        stats[index].savedFeedback = false
    }

    func markAddDirty(id: Int) {
        guard let index = stats.firstIndex(where: { $0.id == id }) else { return }
        stats[index].savedFeedback = false
    }

    func markEditDirty(id: Int) {
        guard let index = stats.firstIndex(where: { $0.id == id }) else { return }
        stats[index].savedFeedback = false
    }

    private func parsePayload(total: String, correct: String, wrong: String, empty: String) -> QuestionStatFormPayload? {
        guard let totalValue = Int(total),
              let correctValue = Int(correct),
              let wrongValue = Int(wrong),
              let emptyValue = Int(empty) else {
            return nil
        }
        return QuestionStatFormPayload(
            totalQuestions: totalValue,
            correct: correctValue,
            wrong: wrongValue,
            empty: emptyValue
        )
    }
}
