import Foundation
import Combine

@MainActor
final class GoalsViewModel: ObservableObject {
    @Published private(set) var goals: [Goal] = []
    @Published private(set) var subjects: [StudySubject] = []
    @Published private(set) var topics: [Topic] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showForm = false
    @Published var scope = "general"
    @Published var type = "weekly"
    @Published var subjectId: Int?
    @Published var topicId: Int?
    @Published var targetDuration = ""
    @Published var startDate = Date()

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    var endDate: Date {
        GoalLabels.endDate(from: startDate, type: type)
    }

    var allowedTypes: [String] {
        GoalLabels.allowedTypes(for: scope)
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let goalsResponse = network.request(Endpoint.goals(), as: CollectionEnvelope<Goal>.self)
            async let subjectsResponse = network.request(Endpoint.subjects(), as: CollectionEnvelope<StudySubject>.self)
            let (goalsEnvelope, subjectsEnvelope) = try await (goalsResponse, subjectsResponse)
            goals = goalsEnvelope.data
            subjects = subjectsEnvelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func scopeChanged(_ newScope: String) {
        scope = newScope
        type = allowedTypes.first ?? "weekly"
        if newScope == "general" {
            subjectId = nil
            topicId = nil
            topics = []
        }
    }

    func subjectChanged(_ newSubjectId: Int?) async {
        subjectId = newSubjectId
        topicId = nil
        topics = []
        guard let newSubjectId else { return }
        do {
            let envelope = try await network.request(Endpoint.topics(subjectId: newSubjectId), as: CollectionEnvelope<Topic>.self)
            topics = envelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func createGoal() async {
        guard let duration = Int(targetDuration), duration > 0 else {
            errorMessage = "Geçerli bir hedef süresi girin."
            return
        }
        if scope == "subject" && subjectId == nil {
            errorMessage = "Ders seçin."
            return
        }
        if scope == "topic" && (subjectId == nil || topicId == nil) {
            errorMessage = "Ders ve konu seçin."
            return
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let payload = GoalFormPayload(
                scope: scope,
                subjectId: scope == "general" ? nil : subjectId,
                topicId: scope == "topic" ? topicId : nil,
                type: type,
                targetDuration: duration,
                startDate: DateFormatters.apiDate.string(from: startDate),
                endDate: DateFormatters.apiDate.string(from: endDate)
            )
            _ = try await network.request(try Endpoint.createGoal(payload), as: MessageDataEnvelope<Goal>.self)
            showForm = false
            targetDuration = ""
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
