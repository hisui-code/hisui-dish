class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate!, only: [ :create ]
  def create
    # メールアドレスでユーザーを特定し、認証に成功したらトークンを払い出す
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      user.regenerate_auth_token if user.auth_token.blank?
      render json: {
                    auth_token: user.auth_token,
                    body: {
                      email: user.email
                    }
                  }
    else
      render json: { error: "invalid_credentials" }, status: :unauthorized
    end
  end
end
