FactoryBot.define do
  factory :user do
    email { "hisui@mail.com" }
    password { "password" }
    auth_token { nil }
  end
end
