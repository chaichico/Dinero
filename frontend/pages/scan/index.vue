<script setup lang="ts">
const scanType = ref<'slip' | 'receipt'>('slip')
const input = ref<HTMLInputElement>()
const router = useRouter()
function handleFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const config = useRuntimeConfig()
  const form = new FormData(); form.append('file', file)
  $fetch<{ data: Record<string, unknown> }>(`${config.public.apiBase}/api/scan/slip`, { method: 'POST', body: form, credentials: 'include' }).then((response) => { sessionStorage.setItem('dinero-scan-draft', JSON.stringify(response.data)); router.push({ path: '/scan/review', query: { type: scanType.value } }) }).catch(() => router.push({ path: '/scan/review', query: { type: scanType.value, offline: '1' } }))
}
</script>
<template>
  <main class="page"><div class="eyebrow">Capture, then check</div><h1 class="display">Scan a paper trail.</h1><p class="muted">Dinero reads the useful bits. You decide what gets saved.</p>
    <div class="toolbar"><button class="pill" :class="{ active: scanType === 'slip' }" @click="scanType = 'slip'">Bank slip</button><button class="pill" :class="{ active: scanType === 'receipt' }" @click="scanType = 'receipt'">Receipt total</button></div>
    <section class="card" style="margin-top:26px;text-align:center;padding:42px 20px"><div style="font-size:48px;margin-bottom:15px">⌁</div><h2 class="section-title">Choose an image</h2><p class="muted">Nothing is stored after processing.</p><input ref="input" hidden type="file" accept="image/*" capture="environment" @change="handleFile"><button class="button accent" style="margin-top:16px" @click="input?.click()">Open camera or files</button></section><p class="muted" style="font-size:12px;margin-top:18px">For privacy, scans are processed temporarily and returned as an editable draft.</p>
  </main>
</template>
