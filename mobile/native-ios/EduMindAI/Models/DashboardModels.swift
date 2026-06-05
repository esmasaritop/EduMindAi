import Foundation

struct DashboardData: Decodable {
    struct Today: Decodable {
        let totalDuration: Int
        let sessionCount: Int
    }

    struct Streak: Decodable {
        let currentStreak: Int
        let longestStreak: Int
        let lastStudyDate: String?
    }

    let today: Today
    let streak: Streak
    let activeGoals: [Goal]
    let weeklyStats: [WeeklyStat]
    let weeklyTopicStats: [WeeklyTopicStat]?

    var topicStats: [WeeklyTopicStat] { weeklyTopicStats ?? [] }
    let unreadNotificationCount: Int

    var todayDuration: Int { today.totalDuration }
    var currentStreak: Int { streak.currentStreak }
    var longestStreak: Int { streak.longestStreak }
    var activeGoalsCount: Int { activeGoals.count }
    var unreadNotifications: Int { unreadNotificationCount }
}

struct WeeklyStat: Decodable, Identifiable {
    var id: String { date }
    let date: String
    let totalDuration: Int
}

struct WeeklyTopicStat: Decodable, Identifiable {
    var id: Int { topicId }
    let topicId: Int
    let topicName: String
    let subjectId: Int
    let subjectName: String
    let weeklyMinutes: Int
    let totalMinutes: Int
}
