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

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
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

    func updateSubject(_ subject: StudySubject, name: String) async {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        do {
            _ = try await network.request(
                try Endpoint.updateSubject(id: subject.id, name: trimmed),
                as: MessageDataEnvelope<StudySubject>.self
            )
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

    func updateTopicName(_ topic: Topic, name: String) async {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        do {
            _ = try await network.request(
                try Endpoint.updateTopic(id: topic.id, payload: TopicUpdatePayload(trackQuestions: nil, name: trimmed)),
                as: DataEnvelope<Topic>.self
            )
            if let subjectId = topic.subjectId {
                await loadTopics(for: subjectId)
            }
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
}
