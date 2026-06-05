import Foundation

final class NetworkManager {
    static let shared = NetworkManager()

    private let session: URLSession
    private let tokenStore: TokenStore
    private let decoder: JSONDecoder

    init(
        session: URLSession = .shared,
        tokenStore: TokenStore = UserDefaultsTokenStore()
    ) {
        self.session = session
        self.tokenStore = tokenStore
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        self.decoder.dateDecodingStrategy = .iso8601
    }

    func request<T: Decodable>(_ endpoint: Endpoint, as type: T.Type = T.self) async throws -> T {
        var req = try endpoint.urlRequest(baseURL: APIConfig.baseURL)

        if endpoint.requiresAuth, let token = tokenStore.token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw NetworkError.invalidResponse }

        guard (200...299).contains(http.statusCode) else {
            let message = (try? decoder.decode(APIErrorMessage.self, from: data))?.message
            throw NetworkError.httpError(statusCode: http.statusCode, message: message)
        }

        guard !data.isEmpty else { throw NetworkError.noData }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }
}

private struct APIErrorMessage: Decodable {
    let message: String?
}

