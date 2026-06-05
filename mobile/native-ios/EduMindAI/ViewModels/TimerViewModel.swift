import Foundation
import Combine

@MainActor
final class TimerViewModel: ObservableObject {
    enum Mode {
        case countdown
        case stopwatch
    }

    @Published private(set) var subjects: [StudySubject] = []
    @Published private(set) var topics: [Topic] = []
    @Published var subjectId: Int?
    @Published var topicId: Int?
    @Published var mode: Mode?
    @Published var countdownHours = 0
    @Published var countdownMinutes = 0
    @Published var elapsedSeconds = 0
    @Published var remainingSeconds = 0
    @Published var isRunning = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let network: NetworkManager
    private var tickTask: Task<Void, Never>?

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    deinit {
        tickTask?.cancel()
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let envelope = try await network.request(Endpoint.subjects(), as: CollectionEnvelope<StudySubject>.self)
            subjects = envelope.data
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

    func applyPreset(minutes: Int) {
        countdownHours = minutes / 60
        countdownMinutes = minutes % 60
    }

    func startCountdown() {
        guard subjectId != nil else {
            errorMessage = "Önce ders seçin."
            return
        }
        mode = .countdown
        remainingSeconds = max(1, countdownHours * 3600 + countdownMinutes * 60)
        startTicking {
            if self.remainingSeconds > 0 {
                self.remainingSeconds -= 1
            } else {
                self.stopTicking()
            }
        }
    }

    func startStopwatch() {
        guard subjectId != nil else {
            errorMessage = "Önce ders seçin."
            return
        }
        mode = .stopwatch
        elapsedSeconds = 0
        startTicking {
            self.elapsedSeconds += 1
        }
    }

    func reset() {
        stopTicking()
        mode = nil
        elapsedSeconds = 0
        remainingSeconds = 0
    }

    func save() async {
        guard let subjectId else { return }
        let minutes: Int
        let notePrefix: String
        switch mode {
        case .countdown:
            minutes = max(1, (countdownHours * 60) + countdownMinutes - (remainingSeconds / 60))
            notePrefix = "Geri sayım"
        case .stopwatch:
            minutes = max(1, elapsedSeconds / 60)
            notePrefix = "Kronometre"
        case .none:
            return
        }
        let selectedTopic = topics.first(where: { $0.id == topicId })
        let notes = selectedTopic.map { "\(notePrefix) · Konu: \($0.name)" } ?? notePrefix
        let now = DateFormatters.isoNow()
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            if let topicId {
                _ = try await network.request(try Endpoint.addTopicTime(id: topicId, minutes: minutes), as: DataEnvelope<Topic>.self)
            }
            _ = try await network.request(
                try Endpoint.createStudySession(
                    StudySessionFormPayload(
                        subjectId: subjectId,
                        duration: minutes,
                        startedAt: now,
                        endedAt: now,
                        sessionType: "timer",
                        notes: notes
                    )
                ),
                as: MessageDataEnvelope<StudySession>.self
            )
            reset()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func startTicking(_ tick: @escaping () -> Void) {
        stopTicking()
        isRunning = true
        tickTask = Task {
            while !Task.isCancelled && isRunning {
                tick()
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
        }
    }

    private func stopTicking() {
        tickTask?.cancel()
        isRunning = false
    }

    func formattedTime(_ totalSeconds: Int) -> String {
        let hours = totalSeconds / 3600
        let minutes = (totalSeconds % 3600) / 60
        let seconds = totalSeconds % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }
}
