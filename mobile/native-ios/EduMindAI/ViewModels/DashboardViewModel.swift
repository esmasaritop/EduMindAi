import Foundation
import Combine

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published private(set) var dashboard: DashboardData?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    func load() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let res = try await network.request(Endpoint.dashboard(), as: DataEnvelope<DashboardData>.self)
            dashboard = res.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

