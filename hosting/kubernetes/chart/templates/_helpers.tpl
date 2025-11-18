{{/*
Expand the name of the chart.
*/}}
{{- define "colanode.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "colanode.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "colanode.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "colanode.labels" -}}
helm.sh/chart: {{ include "colanode.chart" . }}
{{ include "colanode.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "colanode.selectorLabels" -}}
app.kubernetes.io/name: {{ include "colanode.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "colanode.serviceAccountName" -}}
{{- if .Values.colanode.serviceAccount.create }}
{{- default (include "colanode.fullname" .) .Values.colanode.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.colanode.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the PostgreSQL hostname
*/}}
{{- define "colanode.postgresql.hostname" -}}
{{- printf "%s-postgresql" .Release.Name -}}
{{- end }}

{{/*
Return the Redis hostname
*/}}
{{- define "colanode.redis.hostname" -}}
{{- printf "%s-redis-primary" .Release.Name -}}
{{- end }}

{{/*
Return the MinIO hostname
*/}}
{{- define "colanode.minio.hostname" -}}
{{- printf "%s-minio" .Release.Name -}}
{{- end }}

{{/*
Return the default PVC name used for file storage
*/}}
{{- define "colanode.storagePvcName" -}}
{{- printf "%s-storage" (include "colanode.fullname" .) -}}
{{- end }}

{{/*
Return the config.json ConfigMap name
*/}}
{{- define "colanode.configJsonConfigMapName" -}}
{{- if .Values.colanode.configFile.existingConfigMap -}}
{{ .Values.colanode.configFile.existingConfigMap }}
{{- else if .Values.colanode.configFile.name }}
{{ .Values.colanode.configFile.name }}
{{- else }}
{{ printf "%s-config-json" (include "colanode.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Helper to get value from secret key reference or direct value
Usage: {{ include "colanode.getValueOrSecret" (dict "key" "theKey" "value" .Values.path.to.value) }}
*/}}
{{- define "colanode.getValueOrSecret" -}}
{{- $value := .value -}}
{{- if and $value.existingSecret $value.secretKey -}}
valueFrom:
  secretKeyRef:
    name: {{ $value.existingSecret }}
    key: {{ $value.secretKey }}
{{- else if hasKey $value "value" -}}
value: {{ $value.value | quote }}
{{- end -}}
{{- end }}

{{/*
Helper to get required value from secret key reference or direct value
Usage: {{ include "colanode.getRequiredValueOrSecret" (dict "key" "theKey" "value" .Values.path.to.value) }}
*/}}
{{- define "colanode.getRequiredValueOrSecret" -}}
{{- $value := .value -}}
{{- if and $value.existingSecret $value.secretKey -}}
valueFrom:
  secretKeyRef:
    name: {{ $value.existingSecret }}
    key: {{ $value.secretKey }}
{{- else if hasKey $value "value" -}}
value: {{ $value.value | quote }}
{{- else -}}
{{ fail (printf "A value or a secret reference for key '%s' is required." .key) }}
{{- end -}}
{{- end }}

{{/*
Colanode Server Environment Variables
*/}}
{{- define "colanode.serverEnvVars" -}}
- name: NODE_ENV
  value: {{ default "production" .Values.colanode.nodeEnv | quote }}
- name: PORT
  value: {{ .Values.colanode.service.port | quote }}

- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Release.Name }}-postgresql
      key: postgres-password
- name: POSTGRES_URL
  value: "postgres://{{ .Values.postgresql.auth.username }}:$(POSTGRES_PASSWORD)@{{ include "colanode.postgresql.hostname" . }}:5432/{{ .Values.postgresql.auth.database }}"

- name: REDIS_PASSWORD
  {{- if .Values.redis.auth.existingSecret }}
  {{- include "colanode.getRequiredValueOrSecret" (dict
        "key" "redis.auth.password"
        "value" (dict
          "value"        .Values.redis.auth.password
          "existingSecret" .Values.redis.auth.existingSecret
          "secretKey"    .Values.redis.auth.secretKeys.redisPasswordKey )) | nindent 2 }}
  {{- else }}
  valueFrom:
    secretKeyRef:
      name: {{ .Release.Name }}-redis
      key: {{ .Values.redis.auth.secretKeys.redisPasswordKey }}
  {{- end }}
- name: REDIS_URL
  value: "redis://:$(REDIS_PASSWORD)@{{ include "colanode.redis.hostname" . }}:6379/0"

{{- range $index, $env := .Values.colanode.additionalEnv }}
- name: {{ required (printf "colanode.additionalEnv[%d].name is required" $index) $env.name }}
  {{- if hasKey $env "valueFrom" }}
  valueFrom:
{{ toYaml $env.valueFrom | nindent 4 }}
  {{- else if hasKey $env "value" }}
  value: {{ $env.value | quote }}
  {{- else }}
  {{- fail (printf "Provide either value or valueFrom for colanode.additionalEnv[%d]" $index) }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Render extra volume mounts for file:// pointers
*/}}
{{- define "colanode.renderExtraVolumeMounts" -}}
{{- range $mount := . }}
- name: {{ required "colanode.extraVolumeMounts[].name is required" $mount.name }}
  mountPath: {{ required (printf "Specify mountPath for extraVolumeMount %s" $mount.name) $mount.mountPath }}
{{- with $mount.subPath }}
  subPath: {{ . }}
{{- end }}
{{- with $mount.readOnly }}
  readOnly: {{ . }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Render extra volumes (Secrets/ConfigMaps) for file:// pointers
*/}}
{{- define "colanode.renderExtraVolumes" -}}
{{- range $volume := . }}
-
{{ toYaml $volume | nindent 2 }}
{{- end }}
{{- end }}
