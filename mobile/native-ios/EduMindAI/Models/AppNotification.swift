import Foundation

struct AppNotification: Decodable, Identifiable {
    let id: String
    let title: String?
    let body: String?
    let readAt: String?
    let createdAt: String?
}

