import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @StateObject private var vm = DashboardViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let user = auth.currentUser {
                        Text("Merhaba, \(user.name)")
                            .font(.title2.bold())
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if vm.isLoading && vm.dashboard == nil {
                        ProgressView("Yükleniyor...")
                    } else if let dashboard = vm.dashboard {
                        statsGrid(dashboard)
                        weeklyChart(dashboard.weeklyStats)
                        weeklyTopicsSection(dashboard.topicStats)
                        activeGoalsSection(dashboard.activeGoals)
                    } else {
                        Text("Dashboard verisi yok.").foregroundStyle(.secondary)
                    }

                    if let error = vm.errorMessage {
                        Text(error).foregroundStyle(.red)
                    }

                    Button(role: .destructive) {
                        Task { await auth.logout() }
                    } label: {
                        Text("Çıkış yap").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable { await vm.load() }
            .task { await vm.load() }
            .sheet(item: $vm.editingGoal) { goal in
                goalEditSheet(goal)
            }
        }
    }

    private func statsGrid(_ dashboard: DashboardData) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statCard(title: "Bugün", value: "\(dashboard.todayDuration) dk", subtitle: "\(dashboard.today.sessionCount) seans")
            statCard(title: "Streak", value: "\(dashboard.currentStreak)", subtitle: "En uzun: \(dashboard.longestStreak)")
            statCard(title: "Aktif Hedef", value: "\(dashboard.activeGoalsCount)", subtitle: "Devam eden")
            statCard(title: "Bildirim", value: "\(dashboard.unreadNotifications)", subtitle: "Okunmamış")
        }
    }

    private func statCard(title: String, value: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold())
            Text(subtitle).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func weeklyChart(_ stats: [WeeklyStat]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Haftalık Çalışma").font(.headline)
            if stats.isEmpty {
                Text("Veri yok").foregroundStyle(.secondary)
            } else {
                let maxValue = max(stats.map(\.totalDuration).max() ?? 1, 1)
                HStack(alignment: .bottom, spacing: 8) {
                    ForEach(stats) { stat in
                        VStack {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.indigo)
                                .frame(height: CGFloat(stat.totalDuration) / CGFloat(maxValue) * 100)
                            Text(String(stat.date.suffix(5))).font(.caption2)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 130)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func weeklyTopicsSection(_ stats: [WeeklyTopicStat]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Haftalık Konu Çalışması").font(.headline)
            if stats.isEmpty {
                Text("Bu hafta konu verisi yok.").foregroundStyle(.secondary)
            } else {
                ForEach(stats) { stat in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(stat.topicName).font(.subheadline.bold())
                            Text(stat.subjectName).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(stat.weeklyMinutes) dk").font(.subheadline)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func activeGoalsSection(_ goals: [Goal]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Aktif Hedefler").font(.headline)
            if goals.isEmpty {
                Text("Aktif hedef yok.").foregroundStyle(.secondary)
            } else {
                ForEach(goals) { goal in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(GoalLabels.scopeLabel(for: goal)).font(.subheadline.bold())
                            Spacer()
                            Text(GoalLabels.typeLabel(goal.type)).font(.caption)
                            Button("Düzenle") { vm.beginEditing(goal) }
                                .font(.caption)
                        }
                        ProgressView(value: Double(goal.progressPercent ?? 0), total: 100)
                        HStack {
                            Text("\(goal.progressPercent ?? 0)%")
                            Spacer()
                            Text(GoalLabels.statusLabel(goal.status))
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func goalEditSheet(_ goal: Goal) -> some View {
        NavigationStack {
            Form {
                Picker("Periyot", selection: $vm.editType) {
                    ForEach(GoalLabels.allowedTypes(for: goal.resolvedScope), id: \.self) { type in
                        Text(GoalLabels.typeLabel(type)).tag(type)
                    }
                }
                TextField("Hedef süre (dk)", text: $vm.editTargetDuration)
                    .keyboardType(.numberPad)
                DatePicker("Başlangıç", selection: $vm.editStartDate, displayedComponents: .date)
                DatePicker("Bitiş", selection: $vm.editEndDate, displayedComponents: .date)
            }
            .navigationTitle("Hedef Düzenle")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Kapat") { vm.editingGoal = nil }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Kaydet") { Task { await vm.saveGoalEdit() } }
                }
            }
        }
    }
}

extension Goal: Hashable {
    static func == (lhs: Goal, rhs: Goal) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
