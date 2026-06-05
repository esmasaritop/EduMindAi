import Foundation
import Combine

@MainActor
final class AuthViewModel: ObservableObject {
    @Published private(set) var isAuthenticated = false
    @Published private(set) var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let network: NetworkManager
    private let tokenStore: TokenStore

    init(
        network: NetworkManager = .shared,
        tokenStore: TokenStore = UserDefaultsTokenStore()
    ) {
        self.network = network
        self.tokenStore = tokenStore
        self.isAuthenticated = tokenStore.token != nil
        if let data = UserDefaults.standard.data(forKey: "current_user"),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            self.currentUser = user
        }
        network.onUnauthorized = { [weak self] in
            Task { @MainActor in
                self?.clearSession()
            }
        }
    }

    func login(email: String, password: String) async {
        await authenticate {
            try await network.request(try Endpoint.login(email: email, password: password), as: AuthResponse.self)
        }
    }

    func register(name: String, email: String, password: String, passwordConfirmation: String) async {
        let payload = RegisterRequest(
            name: name,
            email: email,
            password: password,
            passwordConfirmation: passwordConfirmation,
            timezone: TimeZone.current.identifier
        )
        await authenticate {
            try await network.request(try Endpoint.register(payload), as: AuthResponse.self)
        }
    }

    func logout() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await network.request(Endpoint.logout(), as: MessageEnvelope.self)
        } catch {
            // Local session should still clear.
        }
        clearSession()
    }

    private func authenticate(_ request: () async throws -> AuthResponse) async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            let response = try await request()
            tokenStore.token = response.token
            currentUser = response.user
            persistUser(response.user)
            isAuthenticated = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            isAuthenticated = false
        }
    }

    private func clearSession() {
        tokenStore.clear()
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: "current_user")
        isAuthenticated = false
    }

    private func persistUser(_ user: User) {
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: "current_user")
        }
    }
}
