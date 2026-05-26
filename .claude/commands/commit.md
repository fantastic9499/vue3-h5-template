---
description: 根据当前暂存区的代码变更，生成一条符合Conventional Commits规范的Commit Message。
allowed-tools: Bash(git add:*), Bash(git diff:*)
---

# 你是一位Git专家。请根据以下代码变更的diff信息，为我生成一条符合Conventional Commits规范的、高质量的`git commit`消息

**当前分支:**
!`git branch --show-current`

**步骤1、获取暂存区变更 (Staged Changes):**
!`git diff --staged`

**步骤2、如果暂存区变更为空，检查是否工作区有未暂存代码，如果工作区也没有未暂存代码，给出友好提示，终止流程**

!`git diff --name-only`

**步骤3、如果工作区有未暂存代码，列出未暂存文件列表，提示用户选择需要暂存的文件（使用 AskUserQuestion 工具，选项为"全部暂存"和"暂存区为空，终止流程"）。如果用户选择全部暂存，则使用 Bash 工具执行 `git add .`**

**然后使用 Bash 工具重新执行 `git diff --staged` 获取暂存区变更**

请只输出commit message本身，不要有任何额外的解释。
