import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @StateObject private var dashboardVM = DashboardViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section("Özet") {
                    if let d = dashboardVM.dashboard {
                        LabeledContent("Bugün", value: "\(d.todayDuration) dk")
                        LabeledContent("Streak", value: "\(d.currentStreak)")
                        LabeledContent("En uzun", value: "\(d.longestStreak)")
                        LabeledContent("Aktif hedef", value: "\(d.activeGoalsCount)")
                        LabeledContent("Okunmamış bildirim", value: "\(d.unreadNotifications)")
                    } else if dashboardVM.isLoading {
                        HStack { ProgressView(); Text("Yükleniyor...") }
                    } else {
                        Text("Dashboard verisi yok.")
                            .foregroundStyle(.secondary)
                    }
                }

                if let error = dashboardVM.errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }

                Section {
                    Button(role: .destructive) {
                        Task { await auth.logout() }
                    } label: {
                        Text("Çıkış yap")
                    }
                }
            }
            .navigationTitle("Ana Sayfa")
            .task {
                await dashboardVM.load()
            }
        }
    }
}

