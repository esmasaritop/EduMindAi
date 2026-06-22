import SwiftUI

struct QuestionsView: View {
    @StateObject private var vm = QuestionsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    headerSection

                    if vm.isLoading && vm.stats.isEmpty {
                        ProgressView("Yükleniyor...")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                    } else if vm.stats.isEmpty {
                        emptyState
                    } else {
                        ForEach($vm.stats) { $stat in
                            QuestionStatCard(stat: $stat) { action in
                                switch action {
                                case .saveAdd:
                                    Task { await vm.saveAdd(stat) }
                                case .saveEdit:
                                    Task { await vm.saveEdit(stat) }
                                case .modeChanged(let mode):
                                    vm.setMode(id: stat.id, mode: mode)
                                case .addFieldChanged:
                                    vm.markAddDirty(id: stat.id)
                                case .editFieldChanged:
                                    vm.markEditDirty(id: stat.id)
                                }
                            }
                        }
                    }

                    if let error = vm.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.red.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Sorularım")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }

    private var headerSection: some View {
        HStack(alignment: .top) {
            Text("Konu bazında soru sayılarını ekleyin veya güncelleyin")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            if !vm.stats.isEmpty {
                Text("\(vm.stats.count) konu")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(Capsule())
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "questionmark.circle")
                .font(.system(size: 48))
                .foregroundStyle(.tertiary)
            Text("Henüz takip edilen konu yok")
                .font(.headline)
            Text("Derslerim sayfasından bir konunun Soru Takibi'ni açarak burada görüntüleyebilirsiniz.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .padding(.horizontal, 20)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

private struct QuestionStatCard: View {
    enum Action {
        case saveAdd
        case saveEdit
        case modeChanged(QuestionsViewModel.InputMode)
        case addFieldChanged
        case editFieldChanged
    }

    @Binding var stat: QuestionsViewModel.EditableStat
    let onAction: (Action) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            cardHeader

            if stat.answered > 0 {
                currentStatsRow
                progressBar
                percentRow
            }

            modePicker
            hintBox
            statInputRow
            addHint
            actionButton
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
    }

    private var cardHeader: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Label(stat.subjectName, systemImage: "book.closed.fill")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.indigo)
                Label(stat.topicName, systemImage: "number")
                    .font(.subheadline.weight(.bold))
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(stat.savedTotal)")
                    .font(.title.weight(.heavy))
                    .foregroundStyle(.indigo)
                Text("Toplam Soru")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var currentStatsRow: some View {
        HStack(spacing: 10) {
            statChip(label: "Toplam", value: stat.savedTotal, color: .indigo)
            statChip(label: "Doğru", value: stat.savedCorrect, color: .green)
            statChip(label: "Yanlış", value: stat.savedWrong, color: .red)
            statChip(label: "Boş", value: stat.savedEmpty, color: .gray)
        }
        .font(.caption.weight(.semibold))
    }

    private func statChip(label: String, value: Int, color: Color) -> some View {
        HStack(spacing: 3) {
            Text("\(label):")
                .foregroundStyle(.secondary)
            Text("\(value)")
                .foregroundStyle(color)
        }
    }

    private var progressBar: some View {
        GeometryReader { geo in
            HStack(spacing: 0) {
                Rectangle()
                    .fill(Color.green)
                    .frame(width: geo.size.width * CGFloat(stat.correctPercent) / 100)
                Rectangle()
                    .fill(Color.red)
                    .frame(width: geo.size.width * CGFloat(stat.wrongPercent) / 100)
                Rectangle()
                    .fill(Color.gray.opacity(0.5))
                    .frame(width: geo.size.width * CGFloat(stat.emptyPercent) / 100)
            }
            .clipShape(Capsule())
        }
        .frame(height: 6)
        .background(Color(.systemGray5))
        .clipShape(Capsule())
    }

    private var percentRow: some View {
        HStack(spacing: 14) {
            Text("✓ \(stat.correctPercent)%").foregroundStyle(.green)
            Text("✗ \(stat.wrongPercent)%").foregroundStyle(.red)
            Text("○ \(stat.emptyPercent)%").foregroundStyle(.secondary)
        }
        .font(.caption.weight(.bold))
    }

    private var modePicker: some View {
        Picker("Mod", selection: $stat.mode) {
            ForEach(QuestionsViewModel.InputMode.allCases) { mode in
                Label(mode.label, systemImage: mode.icon).tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: stat.mode) { _, newMode in
            onAction(.modeChanged(newMode))
        }
    }

    private var hintBox: some View {
        Group {
            if stat.mode == .add {
                Text(stat.isNew
                     ? "İlk kaydınızı yapın: çözdüğünüz soru sayılarını yazıp Ekle butonuna basın."
                     : "Yeni çözdüğünüz soruları ekleyin — mevcut sayılara eklenir, üzerine yazılmaz.")
            } else {
                Text("Tüm sayıları doğrudan güncelleyin. Yanlış kayıt düzeltmek için kullanın.")
            }
        }
        .font(.caption)
        .foregroundStyle(Color.orange.opacity(0.9))
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orange.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var statInputRow: some View {
        HStack(spacing: 8) {
            if stat.mode == .add {
                QuestionStatField(label: "Toplam", color: .indigo, value: $stat.addTotal)
                    .onChange(of: stat.addTotal) { _, _ in onAction(.addFieldChanged) }
                QuestionStatField(label: "Doğru", color: .green, value: $stat.addCorrect)
                    .onChange(of: stat.addCorrect) { _, _ in onAction(.addFieldChanged) }
                QuestionStatField(label: "Yanlış", color: .red, value: $stat.addWrong)
                    .onChange(of: stat.addWrong) { _, _ in onAction(.addFieldChanged) }
                QuestionStatField(label: "Boş", color: .gray, value: $stat.addEmpty)
                    .onChange(of: stat.addEmpty) { _, _ in onAction(.addFieldChanged) }
            } else {
                QuestionStatField(label: "Toplam", color: .indigo, value: $stat.editTotal)
                    .onChange(of: stat.editTotal) { _, _ in onAction(.editFieldChanged) }
                QuestionStatField(label: "Doğru", color: .green, value: $stat.editCorrect)
                    .onChange(of: stat.editCorrect) { _, _ in onAction(.editFieldChanged) }
                QuestionStatField(label: "Yanlış", color: .red, value: $stat.editWrong)
                    .onChange(of: stat.editWrong) { _, _ in onAction(.editFieldChanged) }
                QuestionStatField(label: "Boş", color: .gray, value: $stat.editEmpty)
                    .onChange(of: stat.editEmpty) { _, _ in onAction(.editFieldChanged) }
            }
        }
    }

    @ViewBuilder
    private var addHint: some View {
        if stat.mode == .add,
           stat.addTotal == "0" || stat.addTotal.isEmpty,
           (Int(stat.addCorrect) ?? 0) + (Int(stat.addWrong) ?? 0) + (Int(stat.addEmpty) ?? 0) > 0 {
            Text("Toplam boş bırakılırsa doğru + yanlış + boş otomatik toplam sayılır.")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var actionButton: some View {
        Button {
            onAction(stat.mode == .add ? .saveAdd : .saveEdit)
        } label: {
            HStack {
                if stat.isSaving {
                    ProgressView().tint(.white)
                } else {
                    Image(systemName: stat.mode == .add ? "plus" : "square.and.arrow.down")
                    Text(buttonTitle)
                }
            }
            .font(.subheadline.weight(.semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
        }
        .buttonStyle(.borderedProminent)
        .tint(stat.savedFeedback ? .green : .indigo)
        .disabled(stat.isSaving || (stat.mode == .add && !stat.canSubmitAdd))
    }

    private var buttonTitle: String {
        if stat.isSaving {
            return stat.mode == .add ? "Ekleniyor..." : "Kaydediliyor..."
        }
        if stat.savedFeedback {
            return stat.mode == .add ? "Eklendi ✓" : "Kaydedildi ✓"
        }
        return stat.mode == .add ? "Ekle" : "Kaydet"
    }
}

private struct QuestionStatField: View {
    let label: String
    let color: Color
    @Binding var value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption2.weight(.bold))
                .foregroundStyle(color)
                .textCase(.uppercase)
            TextField("0", text: $value)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.center)
                .font(.body.weight(.bold))
                .foregroundStyle(color)
                .padding(.vertical, 8)
                .background(color.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(color.opacity(0.35), lineWidth: 2)
                )
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .frame(maxWidth: .infinity)
    }
}
