import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/requests/application/create_member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';

class NewMemberRequestScreen extends StatefulWidget {
  const NewMemberRequestScreen({
    required this.createMemberRequest,
    required this.onCreated,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final CreateMemberRequest createMemberRequest;
  final Future<void> Function() onCreated;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<NewMemberRequestScreen> createState() => _NewMemberRequestScreenState();
}

class _NewMemberRequestScreenState extends State<NewMemberRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _summaryFocus = FocusNode(debugLabel: 'request-error-summary');
  final _categoryFocus = FocusNode(debugLabel: 'request-category');
  final _subjectFocus = FocusNode(debugLabel: 'request-subject');
  final _descriptionFocus = FocusNode(debugLabel: 'request-description');
  final _attachmentFocus = FocusNode(debugLabel: 'request-attachment-name');
  final _subjectController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _attachmentController = TextEditingController();

  MemberRequestCategory? _category;
  var _step = 0;
  var _errors = <_RequestFieldError>[];
  var _submitting = false;
  String? _submissionError;

  @override
  void dispose() {
    _summaryFocus.dispose();
    _categoryFocus.dispose();
    _subjectFocus.dispose();
    _descriptionFocus.dispose();
    _attachmentFocus.dispose();
    _subjectController.dispose();
    _descriptionController.dispose();
    _attachmentController.dispose();
    super.dispose();
  }

  bool _validateCurrentStep() {
    final valid = _formKey.currentState?.validate() ?? false;
    final errors = _step == 0 ? _identityErrors() : _informationErrors();
    setState(() => _errors = errors);
    if (!valid || errors.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _summaryFocus.requestFocus();
        }
      });
      return false;
    }
    return true;
  }

  List<_RequestFieldError> _identityErrors() {
    return [
      if (_category == null)
        _RequestFieldError(
          label: 'Choisissez une catégorie.',
          focusNode: _categoryFocus,
        ),
      if (_subjectController.text.trim().isEmpty)
        _RequestFieldError(
          label: 'Saisissez un objet.',
          focusNode: _subjectFocus,
        )
      else if (_subjectController.text.trim().length < 5)
        _RequestFieldError(
          label: 'L’objet doit contenir au moins 5 caractères.',
          focusNode: _subjectFocus,
        ),
    ];
  }

  List<_RequestFieldError> _informationErrors() {
    final description = _descriptionController.text.trim();
    final attachment = _attachmentController.text.trim();
    return [
      if (description.isEmpty)
        _RequestFieldError(
          label: 'Décrivez la demande.',
          focusNode: _descriptionFocus,
        )
      else if (description.length < 20)
        _RequestFieldError(
          label: 'La description doit contenir au moins 20 caractères.',
          focusNode: _descriptionFocus,
        ),
      if (attachment.length > 80)
        _RequestFieldError(
          label: 'Le nom indicatif ne doit pas dépasser 80 caractères.',
          focusNode: _attachmentFocus,
        ),
    ];
  }

  void _continue() {
    if (!_validateCurrentStep()) {
      return;
    }
    setState(() {
      _errors = const [];
      _submissionError = null;
      _step += 1;
    });
    FocusScope.of(context).unfocus();
  }

  void _back() {
    if (_step == 0) {
      context.go('/requests');
      return;
    }
    setState(() {
      _step -= 1;
      _errors = const [];
      _submissionError = null;
    });
  }

  Future<void> _create() async {
    if (_submitting || _category == null) {
      return;
    }
    setState(() {
      _submitting = true;
      _submissionError = null;
    });
    try {
      final attachment = _attachmentController.text.trim();
      final result = await widget.createMemberRequest(
        NewMemberRequestDraft(
          category: _category!,
          subject: _subjectController.text.trim(),
          description: _descriptionController.text.trim(),
          attachmentDisplayName: attachment.isEmpty ? null : attachment,
        ),
      );
      switch (result) {
        case MemberRequestCreated(:final detail):
          await widget.onCreated();
          if (mounted) {
            context.go('/requests/${detail.request.id}');
          }
        case MemberRequestCreationUnavailable(:final reason):
          if (mounted) {
            setState(() => _submissionError = reason);
          }
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => _submissionError =
              'La requête fictive n’a pas pu être créée. Vos informations sont conservées.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Nouvelle requête',
      selectedIndex: 3,
      onSignOut: widget.onSignOut,
      leading: IconButton(
        tooltip: 'Retour à la liste des requêtes',
        onPressed: _back,
        icon: const Icon(Icons.arrow_back),
      ),
      body: ListView(
        key: const Key('new-member-request'),
        padding: const EdgeInsets.all(CnpmSpacing.x4),
        children: [
          Semantics(
            header: true,
            child: Text(
              'Créer une requête',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: CnpmColors.brandBlueDark,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: CnpmSpacing.x2),
          Text(
            'Renseignez les informations nécessaires, puis vérifiez le récapitulatif.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: CnpmColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: CnpmSpacing.x4),
          if (!widget.isDemo)
            const _CreationUnavailable()
          else ...[
            const CnpmNotice(
              message:
                  'Mode démonstration : cette création reste locale et fictive. Rien n’est transmis à la CNPM.',
            ),
            const SizedBox(height: CnpmSpacing.x4),
            _StepIndicator(step: _step),
            const SizedBox(height: CnpmSpacing.x5),
            if (_errors.isNotEmpty) ...[
              _ErrorSummary(focusNode: _summaryFocus, errors: _errors),
              const SizedBox(height: CnpmSpacing.x4),
            ],
            Form(
              key: _formKey,
              child: switch (_step) {
                0 => _IdentityStep(
                  category: _category,
                  categoryFocus: _categoryFocus,
                  subjectFocus: _subjectFocus,
                  subjectController: _subjectController,
                  onCategoryChanged: (value) {
                    setState(() => _category = value);
                  },
                  onContinue: _continue,
                ),
                1 => _InformationStep(
                  descriptionFocus: _descriptionFocus,
                  attachmentFocus: _attachmentFocus,
                  descriptionController: _descriptionController,
                  attachmentController: _attachmentController,
                  onBack: _back,
                  onContinue: _continue,
                ),
                _ => _ReviewStep(
                  category: _category!,
                  subject: _subjectController.text.trim(),
                  description: _descriptionController.text.trim(),
                  attachmentName: _attachmentController.text.trim(),
                  submissionError: _submissionError,
                  submitting: _submitting,
                  onBack: _back,
                  onCreate: _create,
                ),
              },
            ),
            const SizedBox(height: CnpmSpacing.x5),
            const CnpmSyncStatus.demo(),
          ],
        ],
      ),
    );
  }
}

class _IdentityStep extends StatelessWidget {
  const _IdentityStep({
    required this.category,
    required this.categoryFocus,
    required this.subjectFocus,
    required this.subjectController,
    required this.onCategoryChanged,
    required this.onContinue,
  });

  final MemberRequestCategory? category;
  final FocusNode categoryFocus;
  final FocusNode subjectFocus;
  final TextEditingController subjectController;
  final ValueChanged<MemberRequestCategory?> onCategoryChanged;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionTitle(title: 'Nature de la demande'),
        const SizedBox(height: CnpmSpacing.x3),
        DropdownButtonFormField<MemberRequestCategory>(
          key: const Key('request-category-field'),
          initialValue: category,
          focusNode: categoryFocus,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Catégorie *'),
          items: MemberRequestCategory.values
              .map(
                (value) => DropdownMenuItem(
                  value: value,
                  child: Text(_categoryLabel(value)),
                ),
              )
              .toList(),
          onChanged: onCategoryChanged,
          validator: (value) =>
              value == null ? 'Choisissez une catégorie.' : null,
        ),
        const SizedBox(height: CnpmSpacing.x4),
        TextFormField(
          key: const Key('request-subject-field'),
          controller: subjectController,
          focusNode: subjectFocus,
          maxLength: 120,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'Objet *',
            helperText: 'Entre 5 et 120 caractères.',
          ),
          validator: (value) {
            final subject = value?.trim() ?? '';
            if (subject.isEmpty) {
              return 'Saisissez un objet.';
            }
            if (subject.length < 5) {
              return 'Saisissez au moins 5 caractères.';
            }
            return null;
          },
        ),
        const SizedBox(height: CnpmSpacing.x4),
        ElevatedButton(
          key: const Key('request-step-one-continue'),
          onPressed: onContinue,
          child: const Text('Continuer vers les informations'),
        ),
      ],
    );
  }
}

class _InformationStep extends StatelessWidget {
  const _InformationStep({
    required this.descriptionFocus,
    required this.attachmentFocus,
    required this.descriptionController,
    required this.attachmentController,
    required this.onBack,
    required this.onContinue,
  });

  final FocusNode descriptionFocus;
  final FocusNode attachmentFocus;
  final TextEditingController descriptionController;
  final TextEditingController attachmentController;
  final VoidCallback onBack;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionTitle(title: 'Informations partagées'),
        const SizedBox(height: CnpmSpacing.x3),
        TextFormField(
          key: const Key('request-description-field'),
          controller: descriptionController,
          focusNode: descriptionFocus,
          minLines: 4,
          maxLines: 7,
          maxLength: 1000,
          decoration: const InputDecoration(
            labelText: 'Description *',
            alignLabelWithHint: true,
            helperText: 'Entre 20 et 1 000 caractères.',
          ),
          validator: (value) {
            final description = value?.trim() ?? '';
            if (description.isEmpty) {
              return 'Décrivez la demande.';
            }
            if (description.length < 20) {
              return 'Saisissez au moins 20 caractères.';
            }
            return null;
          },
        ),
        const SizedBox(height: CnpmSpacing.x4),
        TextFormField(
          key: const Key('request-attachment-name-field'),
          controller: attachmentController,
          focusNode: attachmentFocus,
          maxLength: 80,
          decoration: const InputDecoration(
            labelText: 'Nom indicatif d’une pièce (facultatif)',
            helperText:
                'Métadonnée seulement : aucun fichier n’est lu, téléversé ou analysé.',
          ),
          validator: (value) {
            if ((value?.trim().length ?? 0) > 80) {
              return 'Limitez le nom indicatif à 80 caractères.';
            }
            return null;
          },
        ),
        const SizedBox(height: CnpmSpacing.x4),
        ElevatedButton(
          key: const Key('request-step-two-continue'),
          onPressed: onContinue,
          child: const Text('Vérifier la requête'),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        OutlinedButton(onPressed: onBack, child: const Text('Retour')),
      ],
    );
  }
}

class _ReviewStep extends StatelessWidget {
  const _ReviewStep({
    required this.category,
    required this.subject,
    required this.description,
    required this.attachmentName,
    required this.submissionError,
    required this.submitting,
    required this.onBack,
    required this.onCreate,
  });

  final MemberRequestCategory category;
  final String subject;
  final String description;
  final String attachmentName;
  final String? submissionError;
  final bool submitting;
  final VoidCallback onBack;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionTitle(title: 'Vérification'),
        const SizedBox(height: CnpmSpacing.x3),
        const CnpmNotice(
          message:
              'La validation crée uniquement un scénario local fictif, avec une référence DEMO-REQ.',
        ),
        const SizedBox(height: CnpmSpacing.x4),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _ReviewRow(label: 'Catégorie', value: _categoryLabel(category)),
                const Divider(height: CnpmSpacing.x6),
                _ReviewRow(label: 'Objet', value: subject),
                const Divider(height: CnpmSpacing.x6),
                _ReviewRow(label: 'Description', value: description),
                if (attachmentName.isNotEmpty) ...[
                  const Divider(height: CnpmSpacing.x6),
                  _ReviewRow(
                    label: 'Métadonnée de pièce',
                    value:
                        '$attachmentName — aucun fichier téléversé ou analysé',
                  ),
                ],
              ],
            ),
          ),
        ),
        if (submissionError != null) ...[
          const SizedBox(height: CnpmSpacing.x4),
          CnpmNotice(tone: CnpmNoticeTone.error, message: submissionError!),
        ],
        const SizedBox(height: CnpmSpacing.x4),
        ElevatedButton.icon(
          key: const Key('create-fictional-request'),
          onPressed: submitting ? null : onCreate,
          icon: submitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.add_comment_outlined),
          label: Text(
            submitting ? 'Création en cours…' : 'Créer la requête fictive',
          ),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        OutlinedButton(
          onPressed: submitting ? null : onBack,
          child: const Text('Modifier les informations'),
        ),
      ],
    );
  }
}

class _ErrorSummary extends StatelessWidget {
  const _ErrorSummary({required this.focusNode, required this.errors});

  final FocusNode focusNode;
  final List<_RequestFieldError> errors;

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: focusNode,
      child: Semantics(
        container: true,
        liveRegion: true,
        label:
            '${errors.length} erreur${errors.length > 1 ? 's' : ''} dans le formulaire',
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: CnpmColors.errorSurface,
            border: Border.all(color: CnpmColors.error),
            borderRadius: BorderRadius.circular(CnpmRadii.control),
          ),
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Corrigez les champs suivants',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: CnpmColors.error,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: CnpmSpacing.x1),
                for (final error in errors)
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: error.focusNode.requestFocus,
                      child: Text(error.label),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RequestFieldError {
  const _RequestFieldError({required this.label, required this.focusNode});

  final String label;
  final FocusNode focusNode;
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    const labels = ['Nature', 'Informations', 'Vérification'];
    return Semantics(
      label: 'Étape ${step + 1} sur 3, ${labels[step]}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Étape ${step + 1} sur 3 — ${labels[step]}',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: CnpmSpacing.x2),
          LinearProgressIndicator(value: (step + 1) / 3),
        ],
      ),
    );
  }
}

class _CreationUnavailable extends StatelessWidget {
  const _CreationUnavailable();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            const Icon(
              Icons.cloud_off_outlined,
              color: CnpmColors.brandBlue,
              size: CnpmSpacing.x8,
            ),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                'Création non connectée',
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              'Le contrat HTTP reste générique. Aucune requête ne peut être envoyée tant qu’un profil typé n’est pas disponible.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: CnpmColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            OutlinedButton.icon(
              onPressed: () => context.go('/requests'),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Retour aux requêtes'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: CnpmColors.textSecondary),
        ),
        const SizedBox(height: CnpmSpacing.x1),
        Text(value, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

String _categoryLabel(MemberRequestCategory category) {
  return switch (category) {
    MemberRequestCategory.generalInformation => 'Information générale',
    MemberRequestCategory.memberData => 'Données du membre',
    MemberRequestCategory.documentHelp => 'Assistance documentaire',
  };
}
