param([string]$AdminUsername, [string]$AdminPassword, [string]$ApiBase = 'http://localhost:3001')
$ErrorActionPreference = 'Stop'
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminBody = @{ username = $AdminUsername; password = $AdminPassword } | ConvertTo-Json
Invoke-RestMethod "$ApiBase/api/auth/login" -Method Post -ContentType 'application/json' -Body $adminBody -WebSession $adminSession -TimeoutSec 20 | Out-Null
Write-Output 'admin-login:ok'
$existing = (Invoke-RestMethod "$ApiBase/api/admin/users" -WebSession $adminSession -TimeoutSec 20).data | Where-Object { $_.role -ne 'super_admin' }
foreach ($old in $existing) { Invoke-RestMethod "$ApiBase/api/admin/users/$($old.id)" -Method Delete -WebSession $adminSession -TimeoutSec 20 | Out-Null }
$generated = Invoke-RestMethod "$ApiBase/api/admin/users/generate" -Method Post -ContentType 'application/json' -Body '{}' -WebSession $adminSession -TimeoutSec 20
Write-Output 'generate-user:ok'
try {
  $userSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $userBody = @{ username = $generated.data.credentials.username; password = $generated.data.credentials.password } | ConvertTo-Json
  Invoke-RestMethod "$ApiBase/api/auth/login" -Method Post -ContentType 'application/json' -Body $userBody -WebSession $userSession -TimeoutSec 20 | Out-Null
  Write-Output 'user-login:ok'
  $forbidden = $false
  try { Invoke-RestMethod "$ApiBase/api/admin/users" -WebSession $userSession -TimeoutSec 20 | Out-Null } catch { $forbidden = $_.Exception.Response.StatusCode.value__ -eq 403 }
  if (-not $forbidden) { throw 'Regular user reached an admin endpoint' }
  Write-Output 'role-guard:ok'
  $cash = (Invoke-RestMethod "$ApiBase/api/accounts" -WebSession $userSession -TimeoutSec 20).data[0]
  $bankBody = @{ name = 'Test Bank'; type = 'bank'; openingBalance = 0 } | ConvertTo-Json
  $bank = Invoke-RestMethod "$ApiBase/api/accounts" -Method Post -ContentType 'application/json' -Body $bankBody -WebSession $userSession -TimeoutSec 20
  $now = [DateTimeOffset]::UtcNow.ToString('o')
  $income = @{ accountId = $cash.id; title = 'Flow income'; amount = 1000; type = 'income'; category = 'Test'; transactionDate = $now; note = 'integration' } | ConvertTo-Json
  $expense = @{ accountId = $cash.id; title = 'Flow expense'; amount = 200; type = 'expense'; category = 'Test'; transactionDate = $now; note = 'integration' } | ConvertTo-Json
  $incomeResult = Invoke-RestMethod "$ApiBase/api/transactions" -Method Post -ContentType 'application/json' -Body $income -WebSession $userSession -TimeoutSec 20
  $expenseResult = Invoke-RestMethod "$ApiBase/api/transactions" -Method Post -ContentType 'application/json' -Body $expense -WebSession $userSession -TimeoutSec 20
  $updatedExpense = @{ accountId = $cash.id; title = 'Flow expense updated'; amount = 200; type = 'expense'; category = 'Test'; transactionDate = $now; note = 'updated' } | ConvertTo-Json
  Invoke-RestMethod "$ApiBase/api/transactions/$($expenseResult.data.id)" -Method Patch -ContentType 'application/json' -Body $updatedExpense -WebSession $userSession -TimeoutSec 20 | Out-Null
  $temporary = Invoke-RestMethod "$ApiBase/api/transactions" -Method Post -ContentType 'application/json' -Body (@{ accountId = $cash.id; title = 'Delete me'; amount = 50; type = 'expense'; category = 'Test'; transactionDate = $now } | ConvertTo-Json) -WebSession $userSession -TimeoutSec 20
  Invoke-RestMethod "$ApiBase/api/transactions/$($temporary.data.id)" -Method Delete -WebSession $userSession -TimeoutSec 20 | Out-Null
  $transfer = @{ fromAccountId = $cash.id; toAccountId = $bank.data.id; amount = 300; transferDate = $now; note = 'integration' } | ConvertTo-Json
  $transferResult = Invoke-RestMethod "$ApiBase/api/transfers" -Method Post -ContentType 'application/json' -Body $transfer -WebSession $userSession -TimeoutSec 20
  $updatedTransfer = @{ fromAccountId = $cash.id; toAccountId = $bank.data.id; amount = 250; transferDate = $now; note = 'updated' } | ConvertTo-Json
  Invoke-RestMethod "$ApiBase/api/transfers/$($transferResult.data.id)" -Method Patch -ContentType 'application/json' -Body $updatedTransfer -WebSession $userSession -TimeoutSec 20 | Out-Null
  Invoke-RestMethod "$ApiBase/api/transfers/$($transferResult.data.id)" -Method Delete -WebSession $userSession -TimeoutSec 20 | Out-Null
  Invoke-RestMethod "$ApiBase/api/transfers" -Method Post -ContentType 'application/json' -Body $transfer -WebSession $userSession -TimeoutSec 20 | Out-Null
  Write-Output 'finance-crud:ok'
  $balances = (Invoke-RestMethod "$ApiBase/api/accounts" -WebSession $userSession -TimeoutSec 20).data
  $start = [uri]::EscapeDataString([DateTimeOffset]::UtcNow.AddDays(-1).ToString('o'))
  $end = [uri]::EscapeDataString([DateTimeOffset]::UtcNow.AddDays(1).ToString('o'))
  $summary = (Invoke-RestMethod "$ApiBase/api/summary?start=$start&end=$end" -WebSession $userSession -TimeoutSec 20).data
  if (($balances | Measure-Object balance -Sum).Sum -ne 800 -or $summary.income -ne 1000 -or $summary.expense -ne 200 -or $summary.net -ne 800) { throw 'Balance or summary invariant failed' }
  Write-Output 'balance-summary:ok'
  $reset = Invoke-RestMethod "$ApiBase/api/admin/users/$($generated.data.user.id)/reset-password" -Method Post -WebSession $adminSession -TimeoutSec 20
  $resetRevoked = $false
  try { Invoke-RestMethod "$ApiBase/api/auth/me" -WebSession $userSession -TimeoutSec 20 | Out-Null } catch { $resetRevoked = $_.Exception.Response.StatusCode.value__ -eq 401 }
  if (-not $resetRevoked) { throw 'Password reset did not revoke the old session' }
  $userSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $resetBody = @{ username = $reset.data.credentials.username; password = $reset.data.credentials.password } | ConvertTo-Json
  Invoke-RestMethod "$ApiBase/api/auth/login" -Method Post -ContentType 'application/json' -Body $resetBody -WebSession $userSession -TimeoutSec 20 | Out-Null
  Write-Output 'reset-relogin:ok'
  $statusBody = @{ status = 'inactive' } | ConvertTo-Json
  Invoke-RestMethod "$ApiBase/api/admin/users/$($generated.data.user.id)/status" -Method Patch -ContentType 'application/json' -Body $statusBody -WebSession $adminSession -TimeoutSec 20 | Out-Null
  $revoked = $false
  try { Invoke-RestMethod "$ApiBase/api/auth/me" -WebSession $userSession -TimeoutSec 20 | Out-Null } catch { $revoked = $_.Exception.Response.StatusCode.value__ -eq 401 }
  if (-not $revoked) { throw 'Deactivation did not revoke the session' }
  Write-Output 'deactivate-revoke:ok'
} finally {
  Invoke-RestMethod "$ApiBase/api/admin/users/$($generated.data.user.id)" -Method Delete -WebSession $adminSession -TimeoutSec 20 | Out-Null
  Write-Output 'cleanup:ok'
}
