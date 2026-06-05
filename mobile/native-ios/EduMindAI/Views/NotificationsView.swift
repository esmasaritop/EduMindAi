import SwiftUI

struct NotificationsView: View {
    @StateObject private var vm = NotificationsViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Text("Okunmamış: \(vm.unreadCount)").font(.headline)
                        Spacer()
                        Button("Tümünü Okundu İşaretle") {
                            Task { await vm.markAllRead() }
                        }
                        .font(.caption)
                    }
                }

                Section("Filtreler") {
                    Picker("Okunma", selection: $vm.readFilter) {
                        Text("Okunmamış").tag("unread")
                        Text("Okunmuş").tag("read")
                        Text("Tümü").tag("all")
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: vm.readFilter) { _, _ in }

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(NotificationLabels.filters) { filter in
                                Button(filter.label) {
                                    vm.typeFilter = filter.id
                                    Task { await vm.load() }
                                }
                                .buttonStyle(.bordered)
                                .tint(vm.typeFilter == filter.id ? .indigo : .gray)
                                .font(.caption)
                            }
                        }
                    }
                }

                Section("Bildirimler") {
                    if vm.filteredNotifications.isEmpty && !vm.isLoading {
                        Text("Bildirim bulunamadı.").foregroundStyle(.secondary)
                    }
                    ForEach(vm.filteredNotifications) { notification in
                        Button {
                            Task { await vm.markRead(notification) }
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                Text(NotificationLabels.meta(for: notification.type).icon)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(notification.title ?? "Bildirim")
                                        .font(.subheadline.bold())
                                        .foregroundStyle(.primary)
                                    Text(notification.message ?? "")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    Text(NotificationLabels.meta(for: notification.type).label)
                                        .font(.caption2)
                                        .foregroundStyle(.indigo)
                                }
                                Spacer()
                                if !notification.isRead {
                                    Circle().fill(Color.red).frame(width: 8, height: 8)
                                }
                            }
                        }
                    }
                }

                if let error = vm.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Bildirimler")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}
