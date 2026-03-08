# 00 Overview

## 概要

HisuiDish は、猫の食事量を重量変化から記録し、Web で可視化するアプリである。

## 目的

- 食事イベントを記録できること
- 皿の残量を把握できること
- 日次、週次、月次、年次で振り返れること
- Device 側の判定設定を Web から更新できること

## システム構成

- Device: Raspberry Pi 5 + Python + HX711
- API: Laravel + PostgreSQL
- Frontend: React + TypeScript + Vite
