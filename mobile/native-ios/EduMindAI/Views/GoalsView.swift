import SwiftUI

struct GoalsView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Spacer()
                Text("Goals Screen")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .navigationTitle("Goals")
        }
    }
}

