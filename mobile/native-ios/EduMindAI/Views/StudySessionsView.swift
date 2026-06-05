import SwiftUI

struct StudySessionsView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Spacer()
                Text("Study Sessions Screen")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .navigationTitle("Study Sessions")
        }
    }
}

