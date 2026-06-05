import Foundation

struct GoalLabels {
    static func scopeLabel(for goal: Goal) -> String {
        switch goal.resolvedScope {
        case "subject": return goal.subjectName ?? "Ders"
        case "topic": return goal.topicName ?? "Konu"
        default: return "Genel"
        }
    }

    static func scopeBadgeLabel(scope: String) -> String {
        switch scope {
        case "subject": return "Ders"
        case "topic": return "Konu"
        default: return "Genel"
        }
    }

    static func typeLabel(_ type: String) -> String {
        switch type {
        case "daily": return "Günlük"
        case "weekly": return "Haftalık"
        case "monthly": return "Aylık"
        default: return type
        }
    }

    static func statusLabel(_ status: String?) -> String {
        switch status {
        case "completed": return "Tamamlandı"
        case "approaching": return "Hedefe yakın"
        case "deadline": return "Süre doluyor"
        case "behind": return "Geride"
        case "on_track": return "Yolunda"
        default: return "Devam ediyor"
        }
    }

    static func progressColor(_ percent: Int) -> String {
        if percent >= 100 { return "green" }
        if percent >= 75 { return "indigo" }
        if percent >= 50 { return "cyan" }
        return "orange"
    }

    static func endDate(from start: Date, type: String) -> Date {
        let calendar = Calendar.current
        switch type {
        case "daily":
            return calendar.date(byAdding: .day, value: 1, to: start) ?? start
        case "monthly":
            return calendar.date(byAdding: .month, value: 1, to: start) ?? start
        default:
            return calendar.date(byAdding: .day, value: 7, to: start) ?? start
        }
    }

    static func allowedTypes(for scope: String) -> [String] {
        switch scope {
        case "general": return ["daily", "weekly", "monthly"]
        default: return ["weekly", "monthly"]
        }
    }
}

struct NotificationLabels {
    struct Filter: Identifiable {
        let id: String
        let label: String
    }

    struct Meta {
        let label: String
        let icon: String
    }

    static let filters: [Filter] = [
        .init(id: "all", label: "Tümü"),
        .init(id: "goal_approaching", label: "Hedefe Yakın"),
        .init(id: "goal_completed", label: "Tamamlanan"),
        .init(id: "goal_deadline", label: "Süre Uyarısı"),
        .init(id: "goal_behind", label: "Geride"),
        .init(id: "topic_weekly_reminder", label: "Konu Hatırlatma"),
        .init(id: "topic_weekly_summary", label: "Haftalık Özet"),
    ]

    static func meta(for type: String?) -> Meta {
        switch type {
        case "goal_approaching": return .init(label: "Hedefe Yakın", icon: "🎯")
        case "goal_completed": return .init(label: "Tamamlandı", icon: "🎉")
        case "goal_deadline": return .init(label: "Süre Uyarısı", icon: "⏰")
        case "goal_behind": return .init(label: "Geride", icon: "📉")
        case "topic_weekly_reminder": return .init(label: "Konu Hatırlatma", icon: "📚")
        case "topic_weekly_summary": return .init(label: "Haftalık Özet", icon: "📊")
        default: return .init(label: "Genel", icon: "🔔")
        }
    }
}

extension Notification.Name {
    static let notificationsUpdated = Notification.Name("notificationsUpdated")
}

struct DateFormatters {
    static let apiDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static let apiDateTime: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static func formatDate(_ value: String) -> String {
        if let date = apiDate.date(from: value) {
            let display = DateFormatter()
            display.dateStyle = .medium
            display.locale = Locale(identifier: "tr_TR")
            return display.string(from: date)
        }
        return value
    }

    static func isoNow() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.string(from: Date())
    }
}
