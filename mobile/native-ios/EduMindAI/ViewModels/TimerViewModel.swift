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
    @Published private(set) var mode: Mode?
    @Published var countdownHours = 2
    @Published var countdownMinutes = 30
    @Published var elapsedSeconds = 0
    @Published var remainingSeconds = 0
    @Published private(set) var countdownTarget = 0
    @Published private(set) var isRunning = false
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

    var isSelectionLocked: Bool {
        isRunning || isCountdownActive || isStopwatchActive
    }

    var isCountdownActive: Bool {
        mode == .countdown && (isRunning || countdownElapsed > 0)
    }

    var isStopwatchActive: Bool {
        mode == .stopwatch && (isRunning || elapsedSeconds > 0)
    }

    var countdownElapsed: Int {
        guard mode == .countdown, countdownTarget > 0 else { return 0 }
        return countdownTarget - remainingSeconds
    }

    var countdownDisplaySeconds: Int {
        if mode == .countdown && (isRunning || countdownElapsed > 0) {
            return remainingSeconds
        }
        return max(0, countdownHours * 3600 + countdownMinutes * 60)
    }

    var canStartCountdown: Bool {
        subjectId != nil && countdownDisplaySeconds > 0 && !isStopwatchActive && !isRunning
    }

    var canStartStopwatch: Bool {
        subjectId != nil && !isCountdownActive && !isRunning
    }

    var canSaveCountdown: Bool {
        mode == .countdown && !isRunning && countdownElapsed > 0
    }

    var canSaveStopwatch: Bool {
        mode == .stopwatch && !isRunning && elapsedSeconds > 0
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

    func applyPreset(hours: Int, minutes: Int) {
        guard !isSelectionLocked else { return }
        countdownHours = hours
        countdownMinutes = minutes
    }

    func startCountdown() {
        guard subjectId != nil else {
            errorMessage = "Önce ders seçin."
            return
        }
        guard !isStopwatchActive else { return }

        let target = max(1, countdownHours * 3600 + countdownMinutes * 60)
        mode = .countdown
        countdownTarget = target
        remainingSeconds = target
        errorMessage = nil
        startTicking {
            if self.remainingSeconds > 0 {
                self.remainingSeconds -= 1
            } else {
                self.stopTicking()
            }
        }
    }

    func stopCountdown() {
        guard mode == .countdown, isRunning else { return }
        stopTicking()
    }

    func startStopwatch() {
        guard subjectId != nil else {
            errorMessage = "Önce ders seçin."
            return
        }
        guard !isCountdownActive else { return }

        mode = .stopwatch
        elapsedSeconds = 0
        errorMessage = nil
        startTicking {
            self.elapsedSeconds += 1
        }
    }

    func stopStopwatch() {
        guard mode == .stopwatch, isRunning else { return }
        stopTicking()
    }

    func resetCountdown() {
        stopTicking()
        if mode == .countdown {
            mode = nil
        }
        countdownTarget = 0
        remainingSeconds = 0
        errorMessage = nil
    }

    func resetStopwatch() {
        stopTicking()
        if mode == .stopwatch {
            mode = nil
        }
        elapsedSeconds = 0
        errorMessage = nil
    }

    func saveCountdown() async {
        let saved = await save(minutes: max(1, countdownElapsed / 60), notePrefix: "Geri sayım")
        if saved { resetCountdown() }
    }

    func saveStopwatch() async {
        let saved = await save(minutes: max(1, elapsedSeconds / 60), notePrefix: "Kronometre")
        if saved { resetStopwatch() }
    }

    @discardableResult
    private func save(minutes: Int, notePrefix: String) async -> Bool {
        guard let subjectId else { return false }
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
            return true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            return false
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
