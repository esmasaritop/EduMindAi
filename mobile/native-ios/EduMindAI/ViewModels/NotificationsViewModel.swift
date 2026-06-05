import Foundation
import Combine

@MainActor
final class NotificationsViewModel: ObservableObject {
    @Published private(set) var notifications: [AppNotification] = []
    @Published private(set) var unreadCount = 0
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var readFilter = "unread"
    @Published var typeFilter = "all"

    private let network: NetworkManager

    init(network: NetworkManager = .shared) {
        self.network = network
    }

    var filteredNotifications: [AppNotification] {
        notifications.filter { notification in
            let matchesRead: Bool
            switch readFilter {
            case "read": matchesRead = notification.isRead
            case "unread": matchesRead = !notification.isRead
            default: matchesRead = true
            }
            let matchesType = typeFilter == "all" || notification.type == typeFilter
            return matchesRead && matchesType
        }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let listResponse = network.request(Endpoint.notifications(type: typeFilter == "all" ? nil : typeFilter), as: PaginatedEnvelope<AppNotification>.self)
            async let summaryResponse = network.request(Endpoint.notificationSummary(), as: DataEnvelope<NotificationSummary>.self)
            let (listEnvelope, summaryEnvelope) = try await (listResponse, summaryResponse)
            notifications = listEnvelope.data
            unreadCount = summaryEnvelope.data.unreadCount
            NotificationCenter.default.post(name: .notificationsUpdated, object: nil, userInfo: ["unreadCount": unreadCount])
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func markAllRead() async {
        do {
            try await network.requestVoid(Endpoint.markAllNotificationsRead())
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func markRead(_ notification: AppNotification) async {
        guard !notification.isRead else { return }
        do {
            try await network.requestVoid(Endpoint.markNotificationRead(id: notification.id))
            await load()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
