import Foundation

struct Goal: Codable, Identifiable {
    let id: Int
    let scope: String?
    let subjectId: Int?
    let topicId: Int?
    let subjectName: String?
    let topicName: String?
    let type: String
    let targetDuration: Int
    let startDate: String
    let endDate: String
    let currentDuration: Int?
    let progressPercent: Int?
    let remainingMinutes: Int?
    let status: String?
    let createdAt: String?

    var resolvedScope: String { scope ?? "general" }
}

struct GoalFormPayload: Encodable {
    let scope: String
    let subjectId: Int?
    let topicId: Int?
    let type: String
    let targetDuration: Int
    let startDate: String
    let endDate: String
}

struct GoalUpdatePayload: Encodable {
    let type: String
    let targetDuration: Int
    let startDate: String
    let endDate: String
}
