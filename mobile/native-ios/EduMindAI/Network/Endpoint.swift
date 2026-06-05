import Foundation

struct Endpoint {
    let method: HTTPMethod
    let path: String
    var queryItems: [URLQueryItem] = []
    var headers: [String: String] = [:]
    var body: Data? = nil
    var requiresAuth: Bool = true

    func urlRequest(baseURL: URL) throws -> URLRequest {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            throw NetworkError.invalidURL
        }
        if !queryItems.isEmpty {
            components.queryItems = queryItems
        }
        guard let url = components.url else { throw NetworkError.invalidURL }

        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.httpBody = body

        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        for (k, v) in headers {
            req.setValue(v, forHTTPHeaderField: k)
        }
        return req
    }
}

extension Endpoint {
    static func login(email: String, password: String) throws -> Endpoint {
        let payload = LoginRequest(email: email, password: password)
        let body: Data
        do {
            body = try JSONEncoder().encode(payload)
        } catch {
            throw NetworkError.encodingError(error)
        }
        return Endpoint(method: .post, path: "auth/login", body: body, requiresAuth: false)
    }

    static func logout() -> Endpoint {
        Endpoint(method: .post, path: "auth/logout")
    }

    static func dashboard() -> Endpoint {
        Endpoint(method: .get, path: "dashboard")
    }

    static func subjects() -> Endpoint {
        Endpoint(method: .get, path: "subjects")
    }

    static func goals() -> Endpoint {
        Endpoint(method: .get, path: "goals")
    }

    static func studySessions() -> Endpoint {
        Endpoint(method: .get, path: "study-sessions")
    }
}

