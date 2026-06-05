import Foundation
import Combine

@MainActor
final class SubjectsViewModel: ObservableObject {
    @Published var subjects: [StudySubject] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    func fetchSubjects() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let res = try await network.request(Endpoint.subjects(), as: CollectionEnvelope<StudySubject>.self)
            subjects = res.data
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

