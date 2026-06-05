import Foundation

struct Goal: Decodable, Identifiable {
    let id: Int
    let userId: Int
    let type: String
    let targetDuration: Int
    let startDate: String
    let endDate: String
}

