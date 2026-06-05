import Foundation

protocol TokenStore: AnyObject {
    var token: String? { get set }
    func clear()
}

final class UserDefaultsTokenStore: TokenStore {
    private let tokenKey = "auth_token"

    var token: String? {
        get { UserDefaults.standard.string(forKey: tokenKey) }
        set { UserDefaults.standard.setValue(newValue, forKey: tokenKey) }
    }

    func clear() {
        token = nil
    }
}

