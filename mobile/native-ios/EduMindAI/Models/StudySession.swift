import Foundation

struct StudySession: Decodable, Identifiable {
    let id: Int
    let duration: Int
    let startedAt: String
    let endedAt: String?
    let sessionType: String?
    let notes: String?
    let createdAt: String?
    let subject: StudySubject?
}

struct StudySessionFormPayload: Encodable {
    let subjectId: Int
    let duration: Int
    let startedAt: String
    let endedAt: String?
    let sessionType: String
    let notes: String?
}
