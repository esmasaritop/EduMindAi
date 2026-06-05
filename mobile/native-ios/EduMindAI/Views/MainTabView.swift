import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }

            SubjectsView()
                .tabItem {
                    Label("Subjects", systemImage: "book")
                }

            GoalsView()
                .tabItem {
                    Label("Goals", systemImage: "target")
                }

            StudySessionsView()
                .tabItem {
                    Label("Sessions", systemImage: "timer")
                }

            NotificationsView()
                .tabItem {
                    Label("Notifications", systemImage: "bell")
                }
        }
    }
}

