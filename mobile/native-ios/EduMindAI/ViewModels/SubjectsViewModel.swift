import Foundation
import Combine

@MainActor
final class SubjectsViewModel: ObservableObject {
    @Published private(set) var subjects: [StudySubject] = []
    @Published private(set) var topicsBySubject: [Int: [Topic]] = [:]
    @Published var expandedSubjectIds: Set<Int> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var newSubjectName = ""
    @Published var newTopicNames: [Int: String] = [:]
    @Published var timerTopicId: Int?
    @Published var timerSeconds = 0
    @Published var isTimerRunning = false

    private let network: NetworkManager
    private var timerTask: Task<Void, Never>?

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    deinit {
        timerTask?.cancel()
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let envelope = try await network.request(Endpoint.subjects(), as: CollectionEnvelope<StudySubject>.self)
            subjects = envelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func loadTopics(for subjectId: Int) async {
        do {
            let envelope = try await network.request(Endpoint.topics(subjectId: subjectId), as: CollectionEnvelope<Topic>.self)
            topicsBySubject[subjectId] = envelope.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func toggleSubject(_ subjectId: Int) async {
        if expandedSubjectIds.contains(subjectId) {
            expandedSubjectIds.remove(subjectId)
        } else {
            expandedSubjectIds.insert(subjectId)
            if topicsBySubject[subjectId] == nil {
                await loadTopics(for: subjectId)
            }
        }
    }

    func createSubject() async {
        let name = newSubjectName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        do {
            _ = try await network.request(try Endpoint.createSubject(name: name), as: MessageDataEnvelope<StudySubject>.self)
            newSubjectName = ""
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func deleteSubject(_ subject: StudySubject) async {
        do {
            try await network.requestVoid(Endpoint.deleteSubject(id: subject.id))
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func createTopic(subjectId: Int) async {
        let name = (newTopicNames[subjectId] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        do {
            _ = try await network.request(
                try Endpoint.createTopic(subjectId: subjectId, payload: TopicFormPayload(name: name, trackQuestions: false)),
                as: DataEnvelope<Topic>.self
            )
            newTopicNames[subjectId] = ""
            await loadTopics(for: subjectId)
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func toggleTrackQuestions(_ topic: Topic) async {
        let next = !(topic.trackQuestions ?? false)
        do {
            _ = try await network.request(
                try Endpoint.updateTopic(id: topic.id, payload: TopicUpdatePayload(trackQuestions: next, name: nil)),
                as: DataEnvelope<Topic>.self
            )
            if let subjectId = topic.subjectId {
                await loadTopics(for: subjectId)
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func addManualTime(topic: Topic, hours: Int, minutes: Int) async {
        let total = max(1, hours * 60 + minutes)
        do {
            _ = try await network.request(try Endpoint.addTopicTime(id: topic.id, minutes: total), as: DataEnvelope<Topic>.self)
            if let subjectId = topic.subjectId {
                await loadTopics(for: subjectId)
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func deleteTopic(_ topic: Topic) async {
        do {
            try await network.requestVoid(Endpoint.deleteTopic(id: topic.id))
            if let subjectId = topic.subjectId {
                await loadTopics(for: subjectId)
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func startTimer(for topic: Topic) {
        timerTopicId = topic.id
        if !isTimerRunning {
            isTimerRunning = true
            timerTask?.cancel()
            timerTask = Task {
                while !Task.isCancelled && isTimerRunning {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    timerSeconds += 1
                }
            }
        }
    }

    func stopTimerAndSave(topic: Topic, subjectId: Int) async {
        timerTask?.cancel()
        isTimerRunning = false
        let minutes = max(1, timerSeconds / 60)
        timerSeconds = 0
        timerTopicId = nil
        let endedAt = DateFormatters.isoNow()
        let startedAt = DateFormatters.isoNow()
        do {
            async let topicTime: DataEnvelope<Topic> = network.request(
                try Endpoint.addTopicTime(id: topic.id, minutes: minutes),
                as: DataEnvelope<Topic>.self
            )
            async let session: MessageDataEnvelope<StudySession> = network.request(
                try Endpoint.createStudySession(
                    StudySessionFormPayload(
                        subjectId: subjectId,
                        duration: minutes,
                        startedAt: startedAt,
                        endedAt: endedAt,
                        sessionType: "timer",
                        notes: "Konu: \(topic.name)"
                    )
                ),
                as: MessageDataEnvelope<StudySession>.self
            )
            _ = try await (topicTime, session)
            await loadTopics(for: subjectId)
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func resetTimer() {
        timerTask?.cancel()
        isTimerRunning = false
        timerSeconds = 0
        timerTopicId = nil
    }
}
