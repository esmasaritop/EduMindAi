import Foundation
import Combine

@MainActor
final class AuthViewModel: ObservableObject {
    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var currentUser: User?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let network: NetworkManager
    private let tokenStore: TokenStore

    init(
        network: NetworkManager = .shared,
        tokenStore: TokenStore = UserDefaultsTokenStore()
    ) {
        self.network = network
        self.tokenStore = tokenStore
        self.isAuthenticated = (tokenStore.token != nil)
    }

    func login(email: String, password: String) async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let endpoint = try Endpoint.login(email: email, password: password)
            let res = try await network.request(endpoint, as: AuthResponse.self)
            tokenStore.token = res.token
            currentUser = res.user
            isAuthenticated = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            isAuthenticated = false
        }
    }

    func logout() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            _ = try await network.request(Endpoint.logout(), as: MessageEnvelope.self)
        } catch {
            // Even if request fails, clear local state to avoid user getting stuck.
        }

        tokenStore.clear()
        currentUser = nil
        isAuthenticated = false
    }
}

