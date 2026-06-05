import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthViewModel

    @State private var email: String = ""
    @State private var password: String = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Spacer()

                VStack(spacing: 8) {
                    Text("EduMindAI")
                        .font(.largeTitle).bold()
                    Text("Giriş yap")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 12) {
                    TextField("E-posta", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)

                    SecureField("Şifre", text: $password)
                        .textFieldStyle(.roundedBorder)
                }

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    Task { await auth.login(email: email, password: password) }
                } label: {
                    HStack {
                        if auth.isLoading { ProgressView() }
                        Text("Giriş")
                            .bold()
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(auth.isLoading || email.isEmpty || password.isEmpty)

                Spacer()
            }
            .padding()
        }
    }
}

