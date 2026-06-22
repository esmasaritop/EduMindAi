import Foundation
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published private(set) var dashboard: DashboardData?
    @Published private(set) var aiRecommendations: [AiRecommendation] = []
    @Published private(set) var canGenerateAi = true
    @Published private(set) var aiCooldownMinutes = 0
    @Published var isLoading = false
    @Published var isLoadingAi = false
    @Published var isGeneratingAi = false
    @Published var errorMessage: String?
    @Published var aiErrorMessage: String?
    @Published var editingGoal: Goal?
    @Published var editType = "weekly"
    @Published var editTargetDuration = ""
    @Published var editStartDate = Date()
    @Published var editEndDate = Date()

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let envelope = try await network.request(Endpoint.dashboard(), as: DataEnvelope<DashboardData>.self)
            dashboard = envelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func loadAiRecommendations() async {
        isLoadingAi = true
        aiErrorMessage = nil
        defer { isLoadingAi = false }
        do {
            async let recommendationsResponse = network.request(
                Endpoint.aiRecommendations(),
                as: CollectionEnvelope<AiRecommendation>.self
            )
            async let statusResponse = network.request(
                Endpoint.aiRecommendationStatus(),
                as: DataEnvelope<AiRecommendationStatus>.self
            )
            let (recommendationsEnvelope, statusEnvelope) = try await (recommendationsResponse, statusResponse)
            aiRecommendations = recommendationsEnvelope.data
            canGenerateAi = statusEnvelope.data.canGenerate
            aiCooldownMinutes = statusEnvelope.data.cooldownRemainingMinutes
        } catch {
            aiErrorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func generateAiRecommendations() async {
        guard canGenerateAi, !isGeneratingAi else { return }
        isGeneratingAi = true
        aiErrorMessage = nil
        defer { isGeneratingAi = false }
        do {
            try await network.requestVoid(Endpoint.generateAiRecommendations())
            await loadAiRecommendations()
        } catch let error as NetworkError {
            if case let .httpError(statusCode, message) = error, statusCode == 429 {
                aiErrorMessage = message
                await loadAiRecommendations()
            } else {
                aiErrorMessage = error.errorDescription
            }
        } catch {
            aiErrorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func beginEditing(_ goal: Goal) {
        editingGoal = goal
        editType = goal.type
        editTargetDuration = String(goal.targetDuration)
        editStartDate = DateFormatters.apiDate.date(from: goal.startDate) ?? Date()
        editEndDate = DateFormatters.apiDate.date(from: goal.endDate) ?? Date()
    }

    func saveGoalEdit() async {
        guard let goal = editingGoal else { return }
        guard let duration = Int(editTargetDuration), duration > 0 else {
            errorMessage = "Geçerli bir hedef süresi girin."
            return
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let payload = GoalUpdatePayload(
                type: editType,
                targetDuration: duration,
                startDate: DateFormatters.apiDate.string(from: editStartDate),
                endDate: DateFormatters.apiDate.string(from: editEndDate)
            )
            _ = try await network.request(try Endpoint.updateGoal(id: goal.id, payload: payload), as: MessageDataEnvelope<Goal>.self)
            editingGoal = nil
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
