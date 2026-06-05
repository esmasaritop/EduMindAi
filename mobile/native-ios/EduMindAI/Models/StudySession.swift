import Foundation

struct StudySession: Decodable, Identifiable {
    let id: Int
    let userId: Int
    let subjectId: Int?
    let duration: Int
    let startedAt: String
    let endedAt: String?
    let sessionType: String?
    let notes: String?

    /// Backend often includes nested `subject` object; we keep it optional.
    let subject: StudySubject?
}

