import Foundation

struct Topic: Decodable, Identifiable {
    let id: Int
    let userId: Int?
    let subjectId: Int?
    let name: String
    let studyTimeMinutes: Int?
    let trackQuestions: Bool?
    let createdAt: String?
    let updatedAt: String?
    let questionStat: QuestionStat?
}

struct TopicFormPayload: Encodable {
    let name: String
    let trackQuestions: Bool
}

struct TopicUpdatePayload: Encodable {
    let trackQuestions: Bool?
    let name: String?
}

struct AddTopicTimePayload: Encodable {
    let minutes: Int
}
