import Foundation
import Combine

@MainActor
final class StudySessionsViewModel: ObservableObject {
    @Published private(set) var sessions: [StudySession] = []
    @Published private(set) var subjects: [StudySubject] = []
    @Published private(set) var topics: [Topic] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showForm = false
    @Published var subjectId: Int?
    @Published var topicId: Int?
    @Published var duration = ""
    @Published var sessionType = "manual"
    @Published var startedAt = Date()
    @Published var endedAt = Date()
    @Published var notes = ""

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let sessionsResponse = network.request(Endpoint.studySessions(page: 1), as: PaginatedEnvelope<StudySession>.self)
            async let subjectsResponse = network.request(Endpoint.subjects(), as: CollectionEnvelope<StudySubject>.self)
            let (sessionsEnvelope, subjectsEnvelope) = try await (sessionsResponse, subjectsResponse)
            sessions = sessionsEnvelope.data
            subjects = subjectsEnvelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func subjectChanged(_ newSubjectId: Int?) async {
        subjectId = newSubjectId
        topicId = nil
        topics = []
        guard let newSubjectId else { return }
        do {
            let envelope = try await network.request(Endpoint.topics(subjectId: newSubjectId), as: CollectionEnvelope<Topic>.self)
            topics = envelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func createSession() async {
        guard let subjectId, let durationValue = Int(duration), durationValue > 0 else {
            errorMessage = "Ders ve geçerli süre gerekli."
            return
        }
        let selectedTopic = topics.first(where: { $0.id == topicId })
        var finalNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        if let selectedTopic {
            let topicNote = "Konu: \(selectedTopic.name)"
            finalNotes = finalNotes.isEmpty ? topicNote : "\(finalNotes) · \(topicNote)"
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let payload = StudySessionFormPayload(
                subjectId: subjectId,
                duration: durationValue,
                startedAt: DateFormatters.isoNow(),
                endedAt: DateFormatters.isoNow(),
                sessionType: sessionType,
                notes: finalNotes.isEmpty ? nil : finalNotes
            )
            _ = try await network.request(try Endpoint.createStudySession(payload), as: MessageDataEnvelope<StudySession>.self)
            if let topicId {
                _ = try await network.request(try Endpoint.addTopicTime(id: topicId, minutes: durationValue), as: DataEnvelope<Topic>.self)
            }
            showForm = false
            duration = ""
            notes = ""
            topicId = nil
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func deleteSession(_ session: StudySession) async {
        do {
            try await network.requestVoid(Endpoint.deleteStudySession(id: session.id))
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func topicName(from notes: String?) -> String {
        guard let notes else { return "—" }
        if let range = notes.range(of: "Konu: ") {
            let remainder = notes[range.upperBound...]
            return remainder.split(separator: "·").first.map(String.init)?.trimmingCharacters(in: .whitespaces) ?? "—"
        }
        return "—"
    }
}
