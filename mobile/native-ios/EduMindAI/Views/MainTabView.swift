import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var unreadCount = 0

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Dashboard", systemImage: "chart.bar") }

            SubjectsView()
                .tabItem { Label("Derslerim", systemImage: "book") }

            TimerView()
                .tabItem { Label("Zamanlayıcı", systemImage: "clock") }

            StudySessionsView()
                .tabItem { Label("Seanslar", systemImage: "timer") }

            GoalsView()
                .tabItem { Label("Hedefler", systemImage: "target") }

            QuestionsView()
                .tabItem { Label("Sorularım", systemImage: "questionmark.circle") }

            NotificationsView()
                .tabItem { Label("Bildirimler", systemImage: "bell") }
                .badge(unreadCount > 0 ? unreadCount : 0)
        }
        .task { await refreshUnreadCount() }
        .onReceive(NotificationCenter.default.publisher(for: .notificationsUpdated)) { output in
            if let count = output.userInfo?["unreadCount"] as? Int {
                unreadCount = count
            }
        }
    }

    private func refreshUnreadCount() async {
        do {
            let envelope = try await NetworkManager.shared.request(Endpoint.notificationSummary(), as: DataEnvelope<NotificationSummary>.self)
            unreadCount = envelope.data.unreadCount
        } catch {
            unreadCount = 0
        }
    }
}
