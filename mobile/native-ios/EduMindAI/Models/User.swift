import Foundation

struct User: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let role: String?
    let timezone: String?
}

