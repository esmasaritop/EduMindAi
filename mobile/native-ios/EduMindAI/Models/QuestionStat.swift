import Foundation

struct QuestionStat: Decodable, Identifiable {
    let id: Int
    let userId: Int?
    let topicId: Int?
    let totalQuestions: Int
    let correct: Int
    let wrong: Int
    let empty: Int
    let createdAt: String?
    let updatedAt: String?
    let topic: QuestionStatTopic?
}

struct QuestionStatTopic: Decodable, Identifiable {
    let id: Int
    let name: String
    let subjectId: Int?
    let subject: StudySubject?
}

struct QuestionStatFormPayload: Encodable {
    let totalQuestions: Int
    let correct: Int
    let wrong: Int
    let empty: Int
}
