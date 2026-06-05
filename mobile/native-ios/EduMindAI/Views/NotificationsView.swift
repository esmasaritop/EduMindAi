import SwiftUI

struct NotificationsView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Spacer()
                Text("Notifications Screen")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .navigationTitle("Notifications")
        }
    }
}

