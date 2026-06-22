import Foundation

struct Endpoint {
    let method: HTTPMethod
    let path: String
    var queryItems: [URLQueryItem] = []
    var headers: [String: String] = [:]
    var body: Data? = nil
    var requiresAuth: Bool = true

    func urlRequest(baseURL: URL) throws -> URLRequest {
        var base = baseURL
        if path.contains("/") {
            for component in path.split(separator: "/") {
                base = base.appendingPathComponent(String(component))
            }
        } else {
            base = base.appendingPathComponent(path)
        }

        guard var components = URLComponents(url: base, resolvingAgainstBaseURL: false) else {
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
        for (key, value) in headers {
            req.setValue(value, forHTTPHeaderField: key)
        }
        return req
    }
}

extension Endpoint {
    static func login(email: String, password: String) throws -> Endpoint {
        Endpoint(
            method: .post,
            path: "auth/login",
            body: try APIClient.encode(LoginRequest(email: email, password: password, deviceName: "ios")),
            requiresAuth: false
        )
    }

    static func register(_ payload: RegisterRequest) throws -> Endpoint {
        Endpoint(
            method: .post,
            path: "auth/register",
            body: try APIClient.encode(payload),
            requiresAuth: false
        )
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

    static func createSubject(name: String) throws -> Endpoint {
        Endpoint(method: .post, path: "subjects", body: try APIClient.encode(NamePayload(name: name)))
    }

    static func updateSubject(id: Int, name: String) throws -> Endpoint {
        Endpoint(method: .put, path: "subjects/\(id)", body: try APIClient.encode(NamePayload(name: name)))
    }

    static func deleteSubject(id: Int) -> Endpoint {
        Endpoint(method: .delete, path: "subjects/\(id)")
    }

    static func topics(subjectId: Int) -> Endpoint {
        Endpoint(method: .get, path: "subjects/\(subjectId)/topics")
    }

    static func createTopic(subjectId: Int, payload: TopicFormPayload) throws -> Endpoint {
        Endpoint(method: .post, path: "subjects/\(subjectId)/topics", body: try APIClient.encode(payload))
    }

    static func updateTopic(id: Int, payload: TopicUpdatePayload) throws -> Endpoint {
        Endpoint(method: .put, path: "topics/\(id)", body: try APIClient.encode(payload))
    }

    static func addTopicTime(id: Int, minutes: Int) throws -> Endpoint {
        Endpoint(method: .patch, path: "topics/\(id)/add-time", body: try APIClient.encode(AddTopicTimePayload(minutes: minutes)))
    }

    static func deleteTopic(id: Int) -> Endpoint {
        Endpoint(method: .delete, path: "topics/\(id)")
    }

    static func goals() -> Endpoint {
        Endpoint(method: .get, path: "goals")
    }

    static func createGoal(_ payload: GoalFormPayload) throws -> Endpoint {
        Endpoint(method: .post, path: "goals", body: try APIClient.encode(payload))
    }

    static func updateGoal(id: Int, payload: GoalUpdatePayload) throws -> Endpoint {
        Endpoint(method: .put, path: "goals/\(id)", body: try APIClient.encode(payload))
    }

    static func studySessions(page: Int = 1) -> Endpoint {
        Endpoint(method: .get, path: "study-sessions", queryItems: [URLQueryItem(name: "page", value: String(page))])
    }

    static func createStudySession(_ payload: StudySessionFormPayload) throws -> Endpoint {
        Endpoint(method: .post, path: "study-sessions", body: try APIClient.encode(payload))
    }

    static func deleteStudySession(id: Int) -> Endpoint {
        Endpoint(method: .delete, path: "study-sessions/\(id)")
    }

    static func questions() -> Endpoint {
        Endpoint(method: .get, path: "questions")
    }

    static func upsertQuestionStat(topicId: Int, payload: QuestionStatFormPayload) throws -> Endpoint {
        Endpoint(method: .post, path: "questions/topics/\(topicId)", body: try APIClient.encode(payload))
    }

    static func addQuestionStat(topicId: Int, payload: QuestionStatFormPayload) throws -> Endpoint {
        Endpoint(method: .patch, path: "questions/topics/\(topicId)/add", body: try APIClient.encode(payload))
    }

    static func notificationSummary() -> Endpoint {
        Endpoint(method: .get, path: "notifications/summary")
    }

    static func notifications(type: String? = nil, perPage: Int = 50) -> Endpoint {
        var items = [URLQueryItem(name: "per_page", value: String(perPage))]
        if let type, type != "all" {
            items.append(URLQueryItem(name: "type", value: type))
        }
        return Endpoint(method: .get, path: "notifications", queryItems: items)
    }

    static func markAllNotificationsRead() -> Endpoint {
        Endpoint(method: .patch, path: "notifications/mark-all-read")
    }

    static func markNotificationRead(id: Int) -> Endpoint {
        Endpoint(method: .patch, path: "notifications/\(id)/read")
    }

    static func aiRecommendations() -> Endpoint {
        Endpoint(method: .get, path: "ai/recommendations")
    }

    static func aiRecommendationStatus() -> Endpoint {
        Endpoint(method: .get, path: "ai/recommendations/status")
    }

    static func generateAiRecommendations() -> Endpoint {
        Endpoint(method: .post, path: "ai/recommendations/generate")
    }
}

private struct NamePayload: Encodable {
    let name: String
}
