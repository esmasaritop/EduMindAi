import SwiftUI

struct SubjectsView: View {
    @StateObject private var viewModel = SubjectsViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding()
                } else {
                    List(viewModel.subjects) { subject in
                        Text(subject.name)
                    }
                }
            }
            .navigationTitle("Subjects")
            .task {
                await viewModel.fetchSubjects()
            }
        }
    }
}

