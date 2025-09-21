Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get :health, to: "health#show"
      get "device_settings/:device_id", to: "device_settings#show"
      put "device_settings/:device_id", to: "device_settings#update"
      patch "device_settings/:device_id", to: "device_settings#update"
    end
  end
end
