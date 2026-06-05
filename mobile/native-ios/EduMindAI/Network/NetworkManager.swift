import Foundation

final class NetworkManager {
    static let shared = NetworkManager()

    var onUnauthorized: (() -> Void)?

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
        self.decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            if let date = DateFormatters.apiDateTime.date(from: value) {
                return date
            }
            let fallback = ISO8601DateFormatter()
            fallback.formatOptions = [.withInternetDateTime]
            if let date = fallback.date(from: value) {
                return date
            }
            if let date = DateFormatters.apiDate.date(from: value) {
                return date
            }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date: \(value)")
        }
    }

    func request<T: Decodable>(_ endpoint: Endpoint, as type: T.Type = T.self) async throws -> T {
        let data = try await performRequest(endpoint)
        guard !data.isEmpty else { throw NetworkError.noData }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw NetworkError.decodingError(error)
        }
    }

    func requestVoid(_ endpoint: Endpoint) async throws {
        _ = try await performRequest(endpoint)
    }

    private func performRequest(_ endpoint: Endpoint) async throws -> Data {
        var req = try endpoint.urlRequest(baseURL: APIConfig.baseURL)

        if endpoint.requiresAuth, let token = tokenStore.token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw NetworkError.invalidResponse }

        if http.statusCode == 401 {
            onUnauthorized?()
            throw NetworkError.httpError(statusCode: 401, message: "Oturum süresi doldu.")
        }

        guard (200...299).contains(http.statusCode) else {
            let message = (try? decoder.decode(APIErrorMessage.self, from: data))?.message
            throw NetworkError.httpError(statusCode: http.statusCode, message: message)
        }

        return data
    }
}

private struct APIErrorMessage: Decodable {
    let message: String?
}
